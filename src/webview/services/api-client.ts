import { routes } from '../utils/api';
import { API_KEY } from '../utils/env';

interface ApiResponse {
	status: number;
	body: string;
	headers: Record<string, string | string[]>;
}

interface StreamingChunk {
	status: number;
	headers: Record<string, string | string[]>;
	streamChunk?: string;
	streamComplete?: boolean;
	streamError?: string;
}

export class ApiClient {
	private requestIdCounter = 0;
	private pendingRequests = new Map<
		string,
		{
			resolve: (response: ApiResponse) => void;
			reject: (error: Error) => void;
		}
	>();

	private pendingStreams = new Map<
		string,
		{
			onChunk: (chunk: string) => void;
			onComplete: () => void;
			onError: (error: Error) => void;
			status?: number;
			headers?: Record<string, string | string[]>;
		}
	>();

	constructor() {
		// Listen for API responses from extension
		window.addEventListener('message', (event) => {
			const message = event.data;

			if (message.command === 'apiResponse' && message.requestId) {
				const pending = this.pendingRequests.get(message.requestId);
				if (pending) {
					this.pendingRequests.delete(message.requestId);
					if (message.success) {
						pending.resolve(message.data);
					} else {
						pending.reject(new Error(message.error || 'API request failed'));
					}
				}
			} else if (message.command === 'apiStreamChunk' && message.requestId) {
				const stream = this.pendingStreams.get(message.requestId);
				if (stream) {
					const chunk = message.chunk as StreamingChunk;

					if (chunk.streamError) {
						stream.onError(new Error(chunk.streamError));
						this.pendingStreams.delete(message.requestId);
					} else if (chunk.streamComplete) {
						stream.onComplete();
					} else {
						// Capture status and headers from first chunk
						if (chunk.status !== undefined && stream.status === undefined) {
							stream.status = chunk.status;
							stream.headers = chunk.headers;
						}
						// Process data chunk
						if (chunk.streamChunk) {
							stream.onChunk(chunk.streamChunk);
						}
					}
				}
			}
		});
	}

	private async request(
		method: 'GET' | 'POST' | 'DELETE',
		url: string,
		body?: FormData | string,
		headers?: Record<string, string>
	): Promise<ApiResponse> {
		const requestId = `req_${++this.requestIdCounter}_${Date.now()}`;

		return new Promise((resolve, reject) => {
			this.pendingRequests.set(requestId, { resolve, reject });

			const apiRequest: any = {
				method,
				url,
				headers: {
					...headers,
					...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {})
				}
			};

			// Handle FormData
			if (body instanceof FormData) {
				const formData: Array<{ name: string; value: string }> = [];
				// Convert FormData to array format
				body.forEach((value, key) => {
					formData.push({ name: key, value: value.toString() });
				});
				apiRequest.formData = formData;
			} else if (body) {
				apiRequest.body = body;
			}

			window.vscode.postMessage({
				command: 'apiRequest',
				requestId,
				apiRequest,
				stream: false
			});

			// Timeout after 30 seconds
			setTimeout(() => {
				if (this.pendingRequests.has(requestId)) {
					this.pendingRequests.delete(requestId);
					reject(new Error('Request timeout'));
				}
			}, 30000);
		});
	}

	private async streamingRequest(
		method: 'GET' | 'POST' | 'DELETE',
		url: string,
		body?: FormData | string,
		headers?: Record<string, string>
	): Promise<ReadableStream<Uint8Array>> {
		const requestId = `stream_${++this.requestIdCounter}_${Date.now()}`;

		// Create the ReadableStream immediately for real-time streaming
		const encoder = new TextEncoder();
		let streamController: ReadableStreamDefaultController<Uint8Array> | null = null;
		let streamResolved = false;

		const stream = new ReadableStream<Uint8Array>({
			start(controller) {
				streamController = controller;
			}
		});

		// Set up the stream handlers
		this.pendingStreams.set(requestId, {
			onChunk: (chunk: string) => {
				if (streamController) {
					streamController.enqueue(encoder.encode(chunk));
				}
			},
			onComplete: () => {
				if (streamController) {
					streamController.close();
					streamController = null;
				}
				this.pendingStreams.delete(requestId);
			},
			onError: (error: Error) => {
				if (streamController) {
					streamController.error(error);
					streamController = null;
				}
				this.pendingStreams.delete(requestId);
			},
			status: undefined,
			headers: undefined
		});

		const apiRequest: any = {
			method,
			url,
			headers: {
				...headers,
				...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {})
			}
		};

		// Handle FormData
		if (body instanceof FormData) {
			const formData: Array<{ name: string; value: string }> = [];
			body.forEach((value, key) => {
				formData.push({ name: key, value: value.toString() });
			});
			apiRequest.formData = formData;
		} else if (body) {
			apiRequest.body = body;
		}

		window.vscode.postMessage({
			command: 'apiRequest',
			requestId,
			apiRequest,
			stream: true
		});

		// Timeout after 60 seconds for streaming
		setTimeout(() => {
			if (this.pendingStreams.has(requestId)) {
				const streamInfo = this.pendingStreams.get(requestId);
				if (streamInfo && streamController) {
					streamController.error(new Error('Streaming request timeout'));
					streamController = null;
				}
				this.pendingStreams.delete(requestId);
			}
		}, 60000);

		return stream;
	}

	// Axios-like interface
	async get(url: string, config?: { withCredentials?: boolean }): Promise<any> {
		const response = await this.request('GET', url);
		if (response.status < 200 || response.status >= 300) {
			throw new Error(response.body || `Request failed with status ${response.status}`);
		}
		return {
			data: response.body ? JSON.parse(response.body) : null,
			status: response.status,
			statusText: response.status >= 200 && response.status < 300 ? 'OK' : 'Error',
			headers: response.headers
		};
	}

	async post(url: string, data?: any, config?: any): Promise<any> {
		const response = await this.request('POST', url, data);
		if (response.status < 200 || response.status >= 300) {
			throw new Error(response.body || `Request failed with status ${response.status}`);
		}
		return {
			data: response.body ? JSON.parse(response.body) : null,
			status: response.status,
			statusText: response.status >= 200 && response.status < 300 ? 'OK' : 'Error',
			headers: response.headers
		};
	}

	async delete(url: string, config?: { withCredentials?: boolean }): Promise<any> {
		const response = await this.request('DELETE', url);
		if (response.status < 200 || response.status >= 300) {
			throw new Error(response.body || `Request failed with status ${response.status}`);
		}
		return {
			data: response.body ? JSON.parse(response.body) : null,
			status: response.status,
			statusText: response.status >= 200 && response.status < 300 ? 'OK' : 'Error',
			headers: response.headers
		};
	}

	// Fetch-like interface for streaming
	async fetch(url: string, config: RequestInit): Promise<Response> {
		const method = (config.method || 'GET') as 'GET' | 'POST' | 'DELETE';
		let body: FormData | string | undefined;

		if (config.body) {
			if (config.body instanceof FormData) {
				body = config.body;
			} else {
				body = config.body.toString();
			}
		}

		const headers: Record<string, string> = {};
		if (config.headers) {
			const headersInit = config.headers as HeadersInit;
			if (headersInit instanceof Headers) {
				headersInit.forEach((value, key) => {
					headers[key] = value;
				});
			} else if (Array.isArray(headersInit)) {
				headersInit.forEach(([key, value]) => {
					headers[key] = value;
				});
			} else {
				Object.assign(headers, headersInit);
			}
		}

		// Check if streaming is needed (based on FormData with stream field)
		if (body instanceof FormData) {
			const streamValue = body.get('stream');
			if (streamValue === 'true') {
				// This is a streaming request - return stream immediately
				// Status and headers will be available in the stream chunks
				const stream = await this.streamingRequest(method, url, body, headers);
				return new Response(stream, {
					status: 200, // Default status, actual status comes in stream
					headers: new Headers()
				});
			}
		}

		// Regular request
		const response = await this.request(method, url, body, headers);
		return new Response(response.body, {
			status: response.status,
			headers: new Headers(response.headers as Record<string, string>)
		});
	}
}

export const apiClient = new ApiClient();
