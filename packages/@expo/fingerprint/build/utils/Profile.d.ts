import type { NormalizedOptions } from '../Fingerprint.types';
/**
 * Wrap a method and profile the time it takes to execute the method using `EXPO_PROFILE`.
 * Works best with named functions (i.e. not arrow functions).
 *
 * @param fn function to profile.
 * @param functionName optional name of the function to display in the profile output.
 */
export declare function profile<IArgs extends any[], T extends (...args: IArgs) => any>(options: NormalizedOptions, fn: T, functionName?: string): T;
