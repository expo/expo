import * as Crypto from 'expo-crypto';
import { CryptoDigestAlgorithm, CryptoEncoding } from 'expo-crypto';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import FunctionDemo, { FunctionDescription } from '../components/FunctionDemo';

const GET_RANDOM_BYTES: FunctionDescription = {
  name: 'getRandomBytes',
  parameters: [
    {
      name: 'byteCount',
      type: 'number',
      values: [10, 128, 512, 1024],
    },
  ],
  actions: Crypto.getRandomBytes,
};

const GET_RANDOM_BYTES_ASYNC: FunctionDescription = {
  name: 'getRandomBytesAsync',
  parameters: [
    {
      name: 'byteCount',
      type: 'number',
      values: [10, 128, 512, 1024],
    },
  ],
  actions: Crypto.getRandomBytesAsync,
};

const GET_RANDOM_VALUES: FunctionDescription = {
  name: 'getRandomValues',
  parameters: [
    {
      name: 'array',
      type: 'enum',
      values: [
        {
          name: 'new Uint16Array(10)',
          value: new Uint16Array(10),
        },
        {
          name: 'new Int8Array(100)',
          value: new Int8Array(100),
        },
        {
          name: 'new Uint8ClampedArray(1)',
          value: new Uint8ClampedArray(1),
        },
      ],
    },
  ],
  actions: Crypto.getRandomValues,
};

const RANDOM_UUID: FunctionDescription = {
  name: 'randomUUID',
  actions: Crypto.randomUUID,
};

const DIGEST_STRING: FunctionDescription = {
  name: 'digestString',
  parameters: [
    {
      name: 'algorithm',
      type: 'string',
      values: [
        CryptoDigestAlgorithm.MD2,
        CryptoDigestAlgorithm.MD5,
        CryptoDigestAlgorithm.SHA1,
        CryptoDigestAlgorithm.SHA256,
        CryptoDigestAlgorithm.SHA384,
        CryptoDigestAlgorithm.SHA512,
      ],
    },
    {
      name: 'data',
      type: 'string',
      values: ["I'm a string", "I'm not a number"],
    },
    {
      name: 'options',
      type: 'object',
      properties: [
        {
          name: 'encoding',
          type: 'string',
          values: [CryptoEncoding.BASE64, CryptoEncoding.HEX],
        },
      ],
    },
  ],
  actions: Crypto.digestStringAsync,
};

const FUNCTIONS_DESCRIPTIONS = [
  GET_RANDOM_BYTES,
  GET_RANDOM_BYTES_ASYNC,
  DIGEST_STRING,
  GET_RANDOM_VALUES,
  RANDOM_UUID,
];

function CryptoScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {FUNCTIONS_DESCRIPTIONS.map((props, idx) => (
        <FunctionDemo key={idx} namespace="Crypto" {...props} />
      ))}
    </ScrollView>
  );
}

CryptoScreen.navigationOptions = {
  title: 'Crypto',
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    justifyContent: 'center',
  },
});

export default CryptoScreen;
