import { SharpCommandOptions, SharpGlobalOptions } from './sharp.types';
export declare function resizeBufferAsync(buffer: Buffer, sizes: number[]): Promise<Buffer[]>;
/**
 * Returns `true` if a global sharp instance can be found.
 * This functionality can be overridden with `process.env.EXPO_IMAGE_UTILS_NO_SHARP=1`.
 */
export declare function isAvailableAsync(): Promise<boolean>;
export declare function sharpAsync(options: SharpGlobalOptions, commands?: SharpCommandOptions[]): Promise<string[]>;
/**
 * Returns the instance of `sharp` installed by the global `sharp-cli` package.
 * This method will throw errors if the `sharp` instance cannot be found, these errors can be circumvented by ensuring `isAvailableAsync()` resolves to `true`.
 */
export declare function findSharpInstanceAsync(): Promise<any | null>;
