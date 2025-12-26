import * as https from 'https';
import * as http from 'http';
import * as vscode from 'vscode';

export interface ApiRequest {
	method: 'GET' | 'POST' | 'DELETE';
	url: string;
	headers?: Record<string, string>;
	body?: string;
	formData?: Array<{ name: string; value: string }>;
}

export interface ApiResponse {
	status: number;
	body: string;
	headers: Record<string, string | string[]>;
}

export interface StreamingApiResponse {
	status: number;
	headers: Record<string, string | string[]>;
	streamChunk?: string;
	streamComplete?: boolean;
	streamError?: string;
}

/**
 * Makes an HTTP/HTTPS request from the extension backend
 * This avoids CORS issues since Node.js doesn't have CORS restrictions
 */
export async function makeApiRequest(request: ApiRequest): Promise<ApiResponse> {
	return new Promise((resolve, reject) => {
		const url = new URL(request.url);
		const isHttps = url.protocol === 'https:';
		const client = isHttps ? https : http;

		// Prepare headers
		const headers: Record<string, string> = { ...request.headers };

		// Handle FormData
		let body: string | undefined;
		if (request.formData && request.formData.length > 0) {
			// Create multipart/form-data boundary
			const boundary = `----WebKitFormBoundary${Date.now()}`;
			headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;

			const formParts: string[] = [];
			for (const field of request.formData) {
				formParts.push(
					`--${boundary}\r\n` +
						`Content-Disposition: form-data; name="${field.name}"\r\n\r\n` +
						`${field.value}\r\n`
				);
			}
			formParts.push(`--${boundary}--\r\n`);
			body = formParts.join('');
		} else if (request.body) {
			body = request.body;
			if (!headers['Content-Type']) {
				headers['Content-Type'] = 'application/json';
			}
		}

		if (body) {
			headers['Content-Length'] = Buffer.byteLength(body).toString();
		}

		const options = {
			hostname: url.hostname,
			port: url.port || (isHttps ? 443 : 80),
			path: url.pathname + url.search,
			method: request.method,
			headers
		};

		const req = client.request(options, (res) => {
			let data = '';
			const responseHeaders: Record<string, string | string[]> = {};

			// Copy headers
			Object.keys(res.headers).forEach((key) => {
				responseHeaders[key] = res.headers[key] || '';
			});

			res.on('data', (chunk: Buffer) => {
				data += chunk.toString();
			});

			res.on('end', () => {
				resolve({
					status: res.statusCode || 500,
					body: data,
					headers: responseHeaders
				});
			});
		});

		req.on('error', (error: Error) => {
			reject(error);
		});

		if (body) {
			req.write(body);
		}

		req.end();
	});
}

/**
 * Makes a streaming HTTP/HTTPS request and sends chunks via callback
 */
export async function makeStreamingApiRequest(
	request: ApiRequest,
	onChunk: (chunk: StreamingApiResponse) => void
): Promise<void> {
	return new Promise((resolve, reject) => {
		const url = new URL(request.url);
		const isHttps = url.protocol === 'https:';
		const client = isHttps ? https : http;

		// Prepare headers
		const headers: Record<string, string> = { ...request.headers };

		// Handle FormData
		let body: string | undefined;
		if (request.formData && request.formData.length > 0) {
			const boundary = `----WebKitFormBoundary${Date.now()}`;
			headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;

			const formParts: string[] = [];
			for (const field of request.formData) {
				formParts.push(
					`--${boundary}\r\n` +
						`Content-Disposition: form-data; name="${field.name}"\r\n\r\n` +
						`${field.value}\r\n`
				);
			}
			formParts.push(`--${boundary}--\r\n`);
			body = formParts.join('');
		} else if (request.body) {
			body = request.body;
			if (!headers['Content-Type']) {
				headers['Content-Type'] = 'application/json';
			}
		}

		if (body) {
			headers['Content-Length'] = Buffer.byteLength(body).toString();
		}

		const options = {
			hostname: url.hostname,
			port: url.port || (isHttps ? 443 : 80),
			path: url.pathname + url.search,
			method: request.method,
			headers
		};

		const req = client.request(options, (res) => {
			const responseHeaders: Record<string, string | string[]> = {};
			Object.keys(res.headers).forEach((key) => {
				responseHeaders[key] = res.headers[key] || '';
			});

			// Send initial response with headers
			onChunk({
				status: res.statusCode || 500,
				headers: responseHeaders
			});

			res.on('data', (chunk: Buffer) => {
				onChunk({
					status: res.statusCode || 500,
					headers: responseHeaders,
					streamChunk: chunk.toString()
				});
			});

			res.on('end', () => {
				onChunk({
					status: res.statusCode || 500,
					headers: responseHeaders,
					streamComplete: true
				});
				resolve();
			});
		});

		req.on('error', (error: Error) => {
			onChunk({
				status: 500,
				headers: {},
				streamError: error.message
			});
			reject(error);
		});

		if (body) {
			req.write(body);
		}

		req.end();
	});
}
