import { AES } from 'expo-crypto';
import { Platform, ScrollView, StyleSheet } from 'react-native';

import FunctionDemo, { FunctionDescription } from '../../components/FunctionDemo';

const GENERATE_KEY: FunctionDescription = {
  name: 'EncryptionKey.generate',
  parameters: [
    {
      name: 'keySize',
      type: 'enum',
      values: [
        { name: 'KeySize.AES128', value: AES.KeySize.AES128 },
        { name: 'KeySize.AES256', value: AES.KeySize.AES256 },
        ...(Platform.OS !== 'web' ? [{ name: 'AES192', value: AES.KeySize.AES192 }] : []),
      ],
    },
  ],
  actions: async (keySize: any) => {
    const key = await AES.EncryptionKey.generate(keySize);
    const keyBytes = await key.bytes();
    return {
      size: key.size,
      keyBytes: Array.from(keyBytes),
    };
  },
};

const IMPORT_KEY: FunctionDescription = {
  name: 'EncryptionKey.import',
  parameters: [
    {
      name: 'encodedKey',
      type: 'enum',
      values: [
        { name: 'Uint8Array(16)', value: ['raw', new Uint8Array(16).fill(42)] },
        {
          name: '"0123456789abcdef0123456789abcdef", "hex"',
          value: ['hex', '0123456789abcdef0123456789abcdef'],
        },
        {
          name: '"yMjIyMjIyMjIyMjIyMjIyA==", "base64"',
          value: ['base64', 'yMjIyMjIyMjIyMjIyMjIyA=='],
        },
      ],
    },
  ],
  actions: async (keyInput: [type: string, value: string | Uint8Array]) => {
    const [inputType, inputValue] = keyInput;
    const encoding = inputType === 'raw' ? undefined : inputType;
    const key = await AES.EncryptionKey.import(inputValue as any, encoding as 'hex' | 'base64');
    const bytes = await key.bytes();
    return {
      size: key.size,
      keyBytes: Array.from(bytes),
    };
  },
};

const EXPORT_KEY_BYTES: FunctionDescription = {
  name: 'key.bytes',
  additionalParameters: [
    {
      name: 'key',
      type: 'enum',
      values: [
        {
          name: 'Random AES128 Key',
          value: async () => await AES.EncryptionKey.generate(AES.KeySize.AES128),
        },
        {
          name: 'Random AES256 Key',
          value: async () => await AES.EncryptionKey.generate(AES.KeySize.AES256),
        },
      ],
    },
  ],
  actions: async (key: any) => {
    const resolvedKey = typeof key === 'function' ? await key() : key;
    const bytes = await resolvedKey.bytes();
    return Array.from(bytes);
  },
};

const EXPORT_KEY_ENCODED: FunctionDescription = {
  name: 'key.encoded',
  additionalParameters: [
    {
      name: 'key',
      type: 'enum',
      values: [
        {
          name: 'Fixed AES256 Key',
          value: async () => await AES.EncryptionKey.import(new Uint8Array(32).fill(170)),
        },
        {
          name: 'Random AES256 Key',
          value: async () => await AES.EncryptionKey.generate(AES.KeySize.AES256),
        },
        {
          name: 'Random AES128 Key',
          value: async () => await AES.EncryptionKey.generate(AES.KeySize.AES128),
        },
      ],
    },
  ],
  parameters: [
    {
      name: 'encoding',
      type: 'string',
      values: ['hex', 'base64'],
    },
  ],
  actions: async (encoding: 'hex' | 'base64', key: () => Promise<AES.EncryptionKey>) => {
    const resolvedKey = await key();
    return await resolvedKey.encoded(encoding);
  },
};

const ENCRYPT_ASYNC: FunctionDescription = {
  name: 'encryptAsync',
  parameters: [
    {
      name: 'plaintext',
      type: 'enum',
      values: [
        { name: 'new Uint8Array([1,2,3,4,5])', value: new Uint8Array([1, 2, 3, 4, 5]) },
        {
          name: 'random Uint8Array(16)',
          value: new Uint8Array(16).fill(0).map(() => Math.floor(Math.random() * 256)),
        },
        {
          name: 'btoa("Hello, World!")',
          value: btoa('Hello, World!'),
        },
      ],
    },
    {
      name: 'key',
      type: 'constant',
      value: () => AES.EncryptionKey.generate(),
    },
    {
      name: 'options',
      type: 'object',
      properties: [
        {
          name: 'nonce',
          type: 'enum',
          values: [
            { name: 'undefined', value: undefined },
            { name: '{ length: 12 }', value: { length: 12 } },
            { name: '{ length: 16 }', value: { length: 16 } },
            { name: '{ bytes: Uint8Array(...) }', value: { bytes: new Uint8Array(12).fill(42) } },
          ],
        },
        {
          name: 'additionalData',
          type: 'enum',
          values: [
            { name: 'undefined', value: undefined },
            { name: 'new Uint8Array([10, 20, 30, 40])', value: new Uint8Array([10, 20, 30, 40]) },
          ],
        },
      ],
    },
  ],
  actions: async (
    plaintext: string | Uint8Array,
    key: () => Promise<AES.EncryptionKey>,
    options: AES.EncryptOptions
  ) => {
    const resolvedKey = await key();
    const sealedData = await AES.encryptAsync(plaintext, resolvedKey, options);
    const iv = await sealedData.iv('base64');
    const tag = await sealedData.tag('base64');
    const ciphertext = await sealedData.ciphertext();
    const combined = await sealedData.combined();
    return {
      ivSize: sealedData.ivSize,
      tagSize: sealedData.tagSize,
      combinedSize: sealedData.combinedSize,
      ivBase64: iv,
      tagBase64: tag,
      ciphertextFirst4: Array.from(ciphertext.slice(0, 4)),
      combinedFirst8: Array.from(combined.slice(0, 8)),
    };
  },
};

const ENCRYPT_DECRYPT_DEMO: FunctionDescription = {
  name: 'Full encrypt/decrypt cycle',
  additionalParameters: [
    {
      name: 'plaintext',
      type: 'enum',
      values: [
        { name: '"Hello, World!"', value: btoa('Hello, World!') },
        { name: '"Secret"', value: btoa('Secret') },
        { name: '"AES Demo Text"', value: btoa('AES Demo Text') },
      ],
    },
    {
      name: 'encryptionAAD',
      type: 'enum',
      values: [
        { name: 'None', value: undefined },
        { name: '[1,2,3]', value: new Uint8Array([1, 2, 3]) },
        { name: '[4,5,6]', value: new Uint8Array([4, 5, 6]) },
      ],
    },
    {
      name: 'decryptionAAD',
      type: 'enum',
      values: [
        { name: 'None', value: undefined },
        { name: '[1,2,3]', value: new Uint8Array([1, 2, 3]) },
        { name: '[4,5,6]', value: new Uint8Array([4, 5, 6]) },
      ],
    },
  ],
  actions: async (plaintext: string, encryptAAD: any, decryptAAD: any) => {
    const key = await AES.EncryptionKey.generate();
    const sealedData = await AES.encryptAsync(plaintext, key, { additionalData: encryptAAD });
    const combinedBase64 = await sealedData.combined('base64');
    const decrypted = await AES.decryptAsync(sealedData, key, {
      output: 'base64',
      additionalData: decryptAAD,
    });
    const originalText = atob(decrypted);

    return {
      original: atob(plaintext),
      encrypted: {
        ivSize: sealedData.ivSize,
        tagSize: sealedData.tagSize,
        combinedSize: sealedData.combinedSize,
        combinedBase64,
      },
      decrypted: originalText,
      success: originalText === atob(plaintext),
    };
  },
};

const FUNCTIONS_DESCRIPTIONS = [
  GENERATE_KEY,
  IMPORT_KEY,
  EXPORT_KEY_BYTES,
  EXPORT_KEY_ENCODED,
  ENCRYPT_ASYNC,
  ENCRYPT_DECRYPT_DEMO,
];

function AESCryptoScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {FUNCTIONS_DESCRIPTIONS.map((props, idx) => (
        <FunctionDemo key={idx} namespace="AES" {...props} />
      ))}
    </ScrollView>
  );
}

AESCryptoScreen.navigationOptions = {
  title: 'AES Encryption',
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    justifyContent: 'center',
  },
});

export default AESCryptoScreen;
