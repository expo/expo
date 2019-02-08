import { FunctionsErrorCode, HttpsErrorInterface } from './types.flow';
export default class HttpsError extends Error implements HttpsErrorInterface {
    details?: any;
    code: FunctionsErrorCode;
    constructor(code: FunctionsErrorCode, message?: string, details?: any);
}
