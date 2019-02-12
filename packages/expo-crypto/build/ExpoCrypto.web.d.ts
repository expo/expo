import { Algorithm, DigestOptions } from './Crypto.types';
declare const _default: {
    readonly name: string;
    digestStringAsync(algorithm: Algorithm, data: string, options: DigestOptions): Promise<string>;
};
export default _default;
