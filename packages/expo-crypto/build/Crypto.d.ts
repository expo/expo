import { Algorithm, DigestOptions } from './Crypto.types';
export * from './Crypto.types';
export declare function digestStringAsync(algorithm: Algorithm, data: string, options?: DigestOptions): Promise<string>;
