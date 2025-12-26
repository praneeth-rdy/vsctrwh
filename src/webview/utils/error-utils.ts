import { ServerResponseStatus } from '../constraints/enums/core-enums';

/**
 * Handles errors from API requests, throwing appropriate error messages.
 * @param error - The error object caught from the API request.
 * @param defaultErrorMessage - The default error message to use if a specific error message cannot be extracted.
 * @throws {Error} With either the specific error message from the API response or the default error message.
 */
export const handleError = (
	error: Error,
	defaultErrorMessage: string,
	options?: {
		redirectToLogin?: boolean;
	}
) => {
	const { redirectToLogin = true } = options || {};

	// Try to parse error message as JSON (for API errors)
	try {
		const errorData = JSON.parse(error.message);
		if (errorData.status === ServerResponseStatus.FAIL && errorData.errorData?.message) {
			// if (errorData.errorData.errorCode === 401 && redirectToLogin) {
			//   // clearStoresAndStorage();
			// }
			throw new Error(errorData.errorData.message);
		}
	} catch {
		// Not JSON, use the error message as-is
	}

	throw new Error(error.message || defaultErrorMessage);
};
