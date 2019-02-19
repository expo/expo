import { CryptoDigestAlgorithm, CryptoDigestOptions, Digest } from './Crypto.types';
export * from './Crypto.types';
export declare function digestStringAsync(algorithm: CryptoDigestAlgorithm, data: string, options?: CryptoDigestOptions): Promise<Digest>;
