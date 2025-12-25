import axios from 'axios';
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
	if (axios.isAxiosError(error) && error.response?.data) {
		const errorResponse = error.response.data as {
			status: string;
			errorData: {
				errorCode: number;
				message: string;
			};
		};
		// if (errorResponse.errorData.errorCode === 401 && redirectToLogin) {
		//   // clearStoresAndStorage();
		// }
		if (errorResponse.status === ServerResponseStatus.FAIL && errorResponse.errorData?.message) {
			throw new Error(errorResponse.errorData.message);
		}
	}
	throw new Error(error.message || defaultErrorMessage);
};
