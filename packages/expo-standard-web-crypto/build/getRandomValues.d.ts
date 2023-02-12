type IntegerArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Uint8ClampedArray;
/**
 * An implementation of Crypto.getRandomValues that uses expo-random's secure random generator if
 * available and falls back to Math.random (cryptographically insecure) when synchronous bridged
 * methods are unavailable.
 *
 * See https://www.w3.org/TR/WebCryptoAPI/#Crypto-method-getRandomValues
 */
export default function getRandomValues<TArray extends ArrayBufferView>(values: TArray): TArray;
export declare function getRandomValuesInsecure<TArray extends IntegerArray>(values: TArray): TArray;
export {};
//# sourceMappingURL=getRandomValues.d.ts.map