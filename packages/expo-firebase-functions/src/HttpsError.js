import type { FunctionsErrorCode } from './types.flow';

export default class HttpsError extends Error {
  +details: ?any;

  +message: string;

  +code: FunctionsErrorCode;

  constructor(code: FunctionsErrorCode, message?: string, details?: any) {
    super(message);
    this.code = code;
    this.details = details;
    this.message = message;
  }
}
