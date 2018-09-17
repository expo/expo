import type { FunctionsErrorCode } from './types.flow';

export default class HttpsError extends Error {
  +details: ?any;
  +code: FunctionsErrorCode;
  constructor(code: FunctionsErrorCode, message?: string, details?: any) {
    super(message);
    this.details = details;
    this.code = code;
  }
}
