/**
 * A general error class that should be used for all errors in Expo modules.
 * Guarantees a `code` field that can be used to differentiate between different
 * types of errors without further subclassing Error.
 */
export class CodedError extends Error {
  code: string;
  info?: any;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

/**
 * A class for errors to be thrown when a property is accessed which is
 * unavailable, unsupported, or not currently implemented on the running
 * platform.
 */
export class UnavailabilityError extends CodedError {
  constructor(moduleName: string, propertyName: string) {
    super('ERR_UNAVAILABLE', `The method or property ${moduleName}.${propertyName} is not available on this platform, are you sure you've linked all the native dependencies properly?`);
  }
}
