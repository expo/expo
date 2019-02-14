import { CryptoDigestAlgorithm, CryptoDigestOptions } from './Crypto.types';
export * from './Crypto.types';
export declare function digestStringAsync(algorithm: CryptoDigestAlgorithm, data: string, options?: CryptoDigestOptions): Promise<string>;
