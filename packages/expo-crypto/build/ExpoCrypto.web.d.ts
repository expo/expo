import { CryptoDigestAlgorithm, CryptoDigestOptions } from './Crypto.types';
declare const _default: {
    readonly name: string;
    digestStringAsync(algorithm: CryptoDigestAlgorithm, data: string, options: CryptoDigestOptions): Promise<string>;
    getRandomBytes(length: number): Uint8Array;
    getRandomBytesAsync(length: number): Promise<Uint8Array>;
};
export default _default;
//# sourceMappingURL=ExpoCrypto.web.d.ts.map