/**
 * Note that instances of this class do NOT pass `instanceof JsonFileError`.
 */
export default class JsonFileError extends Error {
    cause: Error | undefined;
    code: string | undefined;
    fileName: string | undefined;
    isJsonFileError: true;
    constructor(message: string, cause?: Error, code?: string, fileName?: string);
}
export declare class EmptyJsonFileError extends JsonFileError {
    constructor(fileName?: string);
}
