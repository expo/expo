import type { TypedArray } from 'expo-modules-core';
import type { CryptoDigestAlgorithm, CryptoDigestOptions } from './Crypto.types';
declare const _default: {
    digestStringAsync(algorithm: CryptoDigestAlgorithm, data: string, options: CryptoDigestOptions): Promise<string>;
    getRandomBytes(length: number): Uint8Array;
    getRandomBytesAsync(length: number): Promise<Uint8Array>;
    getRandomValues(typedArray: TypedArray): ArrayBufferView<ArrayBuffer>;
    randomUUID(): `${string}-${string}-${string}-${string}-${string}`;
    digestAsync(algorithm: AlgorithmIdentifier, data: ArrayBuffer): Promise<ArrayBuffer>;
};
export default _default;
//# sourceMappingURL=ExpoCrypto.web.d.ts.map