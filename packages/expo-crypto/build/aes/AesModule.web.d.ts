import { NativeModule } from 'expo';
import { DecryptOptions, EncryptOptions, KeySize, SealedDataConfig, BinaryInput } from './aes.types';
declare class EncryptionKey {
    key: CryptoKey;
    keySize: KeySize;
    private constructor();
    static generate(size?: KeySize): Promise<EncryptionKey>;
    static import(input: Uint8Array | string, encoding?: 'hex' | 'base64'): Promise<EncryptionKey>;
    bytes(): Promise<Uint8Array>;
    encoded(encoding: 'hex' | 'base64'): Promise<string>;
    get size(): KeySize;
}
declare class SealedData {
    private buffer;
    private config;
    private constructor();
    static fromCombined(combined: BinaryInput, config?: SealedDataConfig): SealedData;
    static fromParts(iv: BinaryInput, ciphertext: BinaryInput, tag?: BinaryInput | number): SealedData;
    get ivSize(): number;
    get tagSize(): number;
    get combinedSize(): number;
    iv(encoding?: 'bytes' | 'base64'): Promise<Uint8Array | string>;
    tag(encoding?: 'bytes' | 'base64'): Promise<Uint8Array | string>;
    combined(encoding?: 'bytes' | 'base64'): Promise<Uint8Array | string>;
    ciphertext(options?: {
        withTag?: boolean;
        encoding?: 'bytes' | 'base64';
    }): Promise<Uint8Array | string>;
}
type NativeEncryptOptions = Omit<EncryptOptions, 'nonce'> & {
    nonce?: number | Uint8Array | undefined;
};
declare class AesCryptoModule extends NativeModule {
    EncryptionKey: typeof EncryptionKey;
    SealedData: typeof SealedData;
    encryptAsync(plaintext: BinaryInput, key: EncryptionKey, options?: NativeEncryptOptions): Promise<SealedData>;
    decryptAsync(sealedData: SealedData, key: EncryptionKey, options?: DecryptOptions): Promise<string | Uint8Array>;
}
declare const _default: typeof AesCryptoModule;
export default _default;
//# sourceMappingURL=AesModule.web.d.ts.map