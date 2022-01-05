import { CodedError } from './CodedError';
/**
 * A class for errors to be thrown when a property is accessed which is
 * unavailable, unsupported, or not currently implemented on the running
 * platform.
 */
export declare class UnavailabilityError extends CodedError {
    constructor(moduleName: string, propertyName: string);
}
//# sourceMappingURL=UnavailabilityError.d.ts.map