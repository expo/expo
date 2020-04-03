declare type TypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Uint8ClampedArray;
/**
 * A simple Crypto.getRandomValues implementation using Math.random().
 * https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
 * @param typedArray
 */
export declare function getRandomValues<T extends TypedArray>(typedArray: T): T;
export {};
