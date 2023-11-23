/**
 * Note that instances of this class do NOT pass `instanceof JsonFileError`.
 */
export default class JsonFileError extends Error {
  cause: Error | undefined;
  code: string | undefined;
  fileName: string | undefined;
  isJsonFileError: true;

  constructor(message: string, cause?: Error, code?: string, fileName?: string) {
    let fullMessage = message;
    if (fileName) {
      fullMessage += `\n${cause ? '├' : '└'}─ File: ${fileName}`;
    }
    if (cause) {
      fullMessage += `\n└─ Cause: ${cause.name}: ${cause.message}`;
    }
    super(fullMessage);
    this.name = this.constructor.name;
    this.cause = cause;
    this.code = code;
    this.fileName = fileName;
    this.isJsonFileError = true;
  }
}

export class EmptyJsonFileError extends JsonFileError {
  constructor(fileName?: string) {
    super(`Cannot parse an empty JSON string`, undefined, 'EJSONEMPTY', fileName);
  }
}
