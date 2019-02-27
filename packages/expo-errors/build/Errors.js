import CodedError from './CodedError';
export { CodedError };
/**
 * A class for errors to be thrown when a property is accessed which is
 * unavailable, unsupported, or not currently implemented on the running
 * platform.
 */
export class UnavailabilityError extends CodedError {
    constructor(moduleName, propertyName) {
        super('ERR_UNAVAILABLE', `The method or property ${moduleName}.${propertyName} is not available on this platform, are you sure you've linked all the native dependencies properly?`);
    }
}
export { default as warnDeprecated } from './warnDeprecated';
//# sourceMappingURL=Errors.js.map