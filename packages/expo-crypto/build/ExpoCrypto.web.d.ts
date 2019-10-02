import { CryptoDigestAlgorithm, CryptoDigestOptions } from './Crypto.types';
declare const _default: {
    readonly name: string;
    digestStringAsync(algorithm: CryptoDigestAlgorithm, data: string, options: CryptoDigestOptions): Promise<string>;
};
export default _default;
