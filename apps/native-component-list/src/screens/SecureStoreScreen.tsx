import * as SecureStore from 'expo-secure-store';
import * as React from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { BodyText } from '../components/BodyText';
import FunctionDemo, { FunctionDescription } from '../components/FunctionDemo';
import { FunctionParameter } from '../components/FunctionDemo/index.types';
import { useResolvedValue } from '../utilities/useResolvedValue';

const KEY_PARAMETER: FunctionParameter = {
  name: 'key',
  type: 'enum',
  values: [
    { name: "'e2e-key'", value: 'e2e-key' },
    { name: "'other-key'", value: 'other-key' },
  ],
};

const VALUE_PARAMETER: FunctionParameter = {
  name: 'value',
  type: 'enum',
  values: [
    { name: "'hello'", value: 'hello' },
    { name: "'second value'", value: 'second value' },
  ],
};

const KEYCHAIN_SERVICE_PROPERTY: FunctionParameter = {
  name: 'keychainService',
  type: 'enum',
  values: [
    { name: 'undefined', value: undefined },
    { name: "'custom-service'", value: 'custom-service' },
  ],
};

const OPTIONS_PARAMETER: FunctionParameter = {
  name: 'options',
  type: 'object',
  properties: [
    KEYCHAIN_SERVICE_PROPERTY,
    { name: 'requireAuthentication', type: 'boolean', initial: false },
  ],
};

const DELETE_OPTIONS_PARAMETER: FunctionParameter = {
  name: 'options',
  type: 'object',
  properties: [KEYCHAIN_SERVICE_PROPERTY],
};

const SET_ITEM_ASYNC: FunctionDescription = {
  name: 'setItemAsync',
  platforms: ['android', 'ios'],
  parameters: [KEY_PARAMETER, VALUE_PARAMETER, OPTIONS_PARAMETER],
  actions: SecureStore.setItemAsync,
};

const GET_ITEM_ASYNC: FunctionDescription = {
  name: 'getItemAsync',
  platforms: ['android', 'ios'],
  parameters: [KEY_PARAMETER, OPTIONS_PARAMETER],
  actions: SecureStore.getItemAsync,
};

const DELETE_ITEM_ASYNC: FunctionDescription = {
  name: 'deleteItemAsync',
  platforms: ['android', 'ios'],
  parameters: [KEY_PARAMETER, DELETE_OPTIONS_PARAMETER],
  actions: SecureStore.deleteItemAsync,
};

const SET_ITEM: FunctionDescription = {
  name: 'setItem',
  platforms: ['android', 'ios'],
  parameters: [KEY_PARAMETER, VALUE_PARAMETER, OPTIONS_PARAMETER],
  // Wrapped because the native module resolves a value the `void` signature does not promise.
  actions: (key: string, value: string, options: SecureStore.SecureStoreOptions) => {
    SecureStore.setItem(key, value, options);
  },
};

const GET_ITEM: FunctionDescription = {
  name: 'getItem',
  platforms: ['android', 'ios'],
  parameters: [KEY_PARAMETER, OPTIONS_PARAMETER],
  actions: SecureStore.getItem,
};

const CAN_USE_BIOMETRIC_AUTHENTICATION: FunctionDescription = {
  name: 'canUseBiometricAuthentication',
  platforms: ['android', 'ios'],
  parameters: [],
  actions: SecureStore.canUseBiometricAuthentication,
};

const STORAGE_SIZE_LIMIT: FunctionDescription = {
  name: 'storageSizeLimit',
  platforms: ['android', 'ios'],
  parameters: [
    {
      name: 'byteSize',
      type: 'enum',
      values: [
        { name: '4096', value: 4096 },
        { name: '2048', value: 2048 },
        { name: '8192', value: 8192 },
      ],
    },
  ],
  actions: async (byteSize: number) => {
    const safeKey = `size-demo-${Platform.OS}-safe-${byteSize}`;
    const overLimitKey = `size-demo-${Platform.OS}-over-${byteSize + 1}`;
    const results = [`Platform: ${Platform.OS}`];

    try {
      await SecureStore.setItemAsync(safeKey, 'a'.repeat(byteSize));
      results.push(`Successfully stored ${byteSize} bytes.`);
    } catch (error: unknown) {
      results.push(`Failed to store ${byteSize} bytes: ${errorMessage(error)}`);
    }

    try {
      await SecureStore.setItemAsync(overLimitKey, 'a'.repeat(byteSize + 1));
      results.push(`Unexpectedly stored ${byteSize + 1} bytes without error.`);
    } catch (error: unknown) {
      results.push(
        `Storing ${byteSize + 1} bytes failed with native error: ${errorMessage(error)}`
      );
    }

    await Promise.all([
      SecureStore.deleteItemAsync(safeKey).catch(() => {}),
      SecureStore.deleteItemAsync(overLimitKey).catch(() => {}),
    ]);

    return results;
  },
};

const FUNCTIONS_DESCRIPTIONS = [
  SET_ITEM_ASYNC,
  GET_ITEM_ASYNC,
  DELETE_ITEM_ASYNC,
  SET_ITEM,
  GET_ITEM,
  CAN_USE_BIOMETRIC_AUTHENTICATION,
  STORAGE_SIZE_LIMIT,
];

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export default function SecureStoreScreen() {
  const [isAvailable, error] = useResolvedValue(SecureStore.isAvailableAsync);

  const warning = React.useMemo(() => {
    if (error) {
      return `An unknown error occurred while checking the API availability: ${error.message}`;
    } else if (isAvailable === null) {
      return 'Checking availability...';
    } else if (isAvailable === false) {
      return 'SecureStore API is not available on this platform.';
    }
    return null;
  }, [error, isAvailable]);

  if (warning) {
    return (
      <View style={styles.warningContainer}>
        <BodyText>{warning}</BodyText>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <BodyText>
        Hint: a value is readable only with the key and keychainService it was stored with.
      </BodyText>
      {FUNCTIONS_DESCRIPTIONS.map((props, idx) => (
        <FunctionDemo key={idx} namespace="SecureStore" {...props} />
      ))}
    </ScrollView>
  );
}

SecureStoreScreen.navigationOptions = {
  title: 'SecureStore',
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  warningContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
