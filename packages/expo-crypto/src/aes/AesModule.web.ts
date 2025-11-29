import { registerWebModule, NativeModule } from 'expo';

import {
  DecryptOptions,
  EncryptOptions,
  KeySize,
  SealedDataConfig,
  BinaryInput,
} from './aes.types';
import {
  base64ToUintArray,
  binaryInputBytes,
  bytesToHex,
  hexToUintArray,
  uint8ArrayToBase64,
} from './web-utils';

const DEFAULT_IV_LENGTH = 12;
const DEFAULT_TAG_LENGTH = 16;

const defaultConfig: SealedDataConfig = {
  ivLength: DEFAULT_IV_LENGTH,
  tagLength: DEFAULT_TAG_LENGTH,
};

class EncryptionKey {
  key: CryptoKey;
  keySize: KeySize;

  private constructor(key: CryptoKey, size: KeySize) {
    this.key = key;
    this.keySize = size;
  }

  static async generate(size?: KeySize): Promise<EncryptionKey> {
    const keySize = size ?? KeySize.AES256;
    const algorithm = { name: 'AES-GCM', length: keySize };
    const key = await crypto.subtle.generateKey(algorithm, true, ['encrypt', 'decrypt']);
    return new EncryptionKey(key, keySize);
  }

  static async import(
    input: Uint8Array | string,
    encoding?: 'hex' | 'base64'
  ): Promise<EncryptionKey> {
    let bytes: Uint8Array;
    if (typeof input === 'string') {
      bytes = encoding === 'base64' ? base64ToUintArray(input) : hexToUintArray(input);
    } else {
      bytes = input;
    }

    const key = await crypto.subtle.importKey('raw', bytes as BufferSource, 'AES-GCM', true, [
      'encrypt',
      'decrypt',
    ]);
    return new EncryptionKey(key, bytes.byteLength * 8);
  }

  async bytes(): Promise<Uint8Array> {
    const buffer = await crypto.subtle.exportKey('raw', this.key);
    return new Uint8Array(buffer);
  }

  async encoded(encoding: 'hex' | 'base64'): Promise<string> {
    const bytes = await this.bytes();
    const encoded = encoding === 'base64' ? uint8ArrayToBase64(bytes) : bytesToHex(bytes);
    return encoded;
  }

  get size(): KeySize {
    return this.keySize;
  }
}

class SealedData {
  private buffer: ArrayBuffer;
  private config: SealedDataConfig;

  private constructor(buffer: ArrayBuffer, config: SealedDataConfig) {
    this.buffer = buffer;
    this.config = config;
  }

  static fromCombined(combined: BinaryInput, config?: SealedDataConfig): SealedData {
    const buffer = binaryInputBytes(combined).buffer as ArrayBuffer;
    return new SealedData(buffer, config ?? defaultConfig);
  }

  static fromParts(
    iv: BinaryInput,
    ciphertext: BinaryInput,
    tag?: BinaryInput | number
  ): SealedData {
    const ciphertextBytes = binaryInputBytes(ciphertext);
    const ivBytes = binaryInputBytes(iv);
    const ivLength = ivBytes.byteLength;

    if (!tag) {
      tag = DEFAULT_TAG_LENGTH;
    }

    if (typeof tag === 'number') {
      const totalLength = ivLength + ciphertextBytes.byteLength;
      const combined = new Uint8Array(totalLength);
      combined.set(ivBytes);
      combined.set(ciphertextBytes, ivLength);

      const config: SealedDataConfig = {
        ivLength,
        tagLength: tag,
      };
      return new SealedData(combined.buffer, config);
    }

    const tagBytes = binaryInputBytes(tag);
    const tagLength = tagBytes.byteLength;
    const totalLength = ivLength + ciphertextBytes.byteLength + tagLength;

    const combined = new Uint8Array(totalLength);
    combined.set(ivBytes);
    combined.set(ciphertextBytes, ivLength);
    combined.set(tagBytes, totalLength - tagLength);

    return new SealedData(combined.buffer, { ivLength, tagLength });
  }

  get ivSize(): number {
    return this.config.ivLength;
  }
  get tagSize(): number {
    return this.config.tagLength;
  }
  get combinedSize(): number {
    return this.buffer.byteLength;
  }

  async iv(encoding?: 'bytes' | 'base64'): Promise<Uint8Array | string> {
    const useBase64 = encoding === 'base64';
    const bytes = new Uint8Array(this.buffer, 0, this.ivSize);
    return useBase64 ? uint8ArrayToBase64(bytes) : bytes;
  }
  async tag(encoding?: 'bytes' | 'base64'): Promise<Uint8Array | string> {
    const useBase64 = encoding === 'base64';
    const offset = this.combinedSize - this.tagSize;
    const bytes = new Uint8Array(this.buffer, offset, this.tagSize);
    return useBase64 ? uint8ArrayToBase64(bytes) : bytes;
  }
  async combined(encoding?: 'bytes' | 'base64'): Promise<Uint8Array | string> {
    const useBase64 = encoding === 'base64';
    const bytes = new Uint8Array(this.buffer);
    return useBase64 ? uint8ArrayToBase64(bytes) : bytes;
  }
  async ciphertext(options?: {
    withTag?: boolean;
    encoding?: 'bytes' | 'base64';
  }): Promise<Uint8Array | string> {
    const includeTag = options?.withTag ?? false;
    const useBase64 = options?.encoding === 'base64';

    const taggedCiphertextLength = this.combinedSize - this.ivSize;
    const ciphertextLength = includeTag
      ? taggedCiphertextLength
      : taggedCiphertextLength - this.tagSize;

    const bytes = new Uint8Array(this.buffer, this.ivSize, ciphertextLength);
    return useBase64 ? uint8ArrayToBase64(bytes) : bytes;
  }
}

type NativeEncryptOptions = Omit<EncryptOptions, 'nonce'> & {
  nonce?: number | Uint8Array | undefined;
};

class AesCryptoModule extends NativeModule {
  EncryptionKey = EncryptionKey;
  SealedData = SealedData;

  async encryptAsync(
    plaintext: BinaryInput,
    key: EncryptionKey,
    options: NativeEncryptOptions = {}
  ): Promise<SealedData> {
    const {
      nonce = DEFAULT_IV_LENGTH,
      tagLength = DEFAULT_TAG_LENGTH,
      additionalData: aad,
    } = options;

    const iv =
      typeof nonce === 'number'
        ? crypto.getRandomValues(new Uint8Array(nonce))
        : binaryInputBytes(nonce);

    const baseParams = { name: 'AES-GCM', iv, tagLength: tagLength * 8 };

    // workaround for invalid AAD format error when it's present but undefined
    const gcmParams = aad
      ? {
          ...baseParams,
          additionalData: binaryInputBytes(aad),
        }
      : baseParams;

    const ciphertextWithTag = await crypto.subtle.encrypt(
      gcmParams,
      key.key,
      binaryInputBytes(plaintext) as BufferSource
    );

    return SealedData.fromParts(iv, ciphertextWithTag, tagLength);
  }

  async decryptAsync(
    sealedData: SealedData,
    key: EncryptionKey,
    options: DecryptOptions = {}
  ): Promise<string | Uint8Array> {
    const { additionalData: aad, output } = options;

    // workaround for invalid AAD format error when it's present but undefined
    const iv = await sealedData.iv();
    const baseParams = {
      name: 'AES-GCM',
      iv: iv as BufferSource,
      tagLength: sealedData.tagSize * 8,
    };
    const gcmParams: AesGcmParams = aad
      ? {
          ...baseParams,
          additionalData: binaryInputBytes(aad) as BufferSource,
        }
      : baseParams;

    const taggedCiphertext = await sealedData.ciphertext({ withTag: true });
    const plaintextBuffer = await crypto.subtle.decrypt(
      gcmParams,
      key.key,
      taggedCiphertext as BufferSource
    );

    const useBase64 = output === 'base64';
    const bytes = new Uint8Array(plaintextBuffer);
    return useBase64 ? uint8ArrayToBase64(bytes) : bytes;
  }
}

export default registerWebModule(AesCryptoModule, 'ExpoCryptoAES');
