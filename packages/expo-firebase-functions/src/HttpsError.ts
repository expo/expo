import { FunctionsErrorCode, HttpsErrorInterface } from './types.flow';

export default class HttpsError extends Error implements HttpsErrorInterface {
  details?: any;

  code: FunctionsErrorCode;

  constructor(code: FunctionsErrorCode, message?: string, details?: any) {
    super(message);
    this.code = code;
    this.details = details;
    if (message !== undefined) {
      this.message = message;
    }
  }
}
