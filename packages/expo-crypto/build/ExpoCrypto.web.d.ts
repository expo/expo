import { TypedArray } from 'expo-modules-core';
import { CryptoDigestAlgorithm, CryptoDigestOptions } from './Crypto.types';
declare const _default: {
    readonly name: string;
    digestStringAsync(algorithm: CryptoDigestAlgorithm, data: string, options: CryptoDigestOptions): Promise<string>;
    getRandomValues(typedArray: TypedArray): TypedArray;
    randomUUID(): string;
};
export default _default;
//# sourceMappingURL=ExpoCrypto.web.d.ts.map