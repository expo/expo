import * as SecureStore from 'expo-secure-store';
import * as React from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
  Switch,
  StyleSheet,
} from 'react-native';

import ListButton from '../components/ListButton';
import Colors from '../constants/Colors';
import { useResolvedValue } from '../utilities/useResolvedValue';

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
      <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
        <Text>{warning}</Text>
      </View>
    );
  }

  return <SecureStoreView />;
}

function SecureStoreView() {
  const [key, setKey] = React.useState<string | undefined>();
  const [value, setValue] = React.useState<string | undefined>();
  const [service, setService] = React.useState<string | undefined>();
  const [requireAuth, setRequireAuth] = React.useState<boolean>(false);
  const [byteSize, setByteSize] = React.useState<string>('4096');

  const storeOptions = React.useMemo<SecureStore.SecureStoreOptions>(
    () => ({
      keychainService: service,
      requireAuthentication: requireAuth,
      authenticationPrompt: requireAuth ? 'Authenticate' : undefined,
    }),
    [requireAuth, service]
  );

  async function storeValueAsync(value: string, key: string) {
    try {
      await SecureStore.setItemAsync(key, value, {
        keychainService: service,
        requireAuthentication: requireAuth,
        authenticationPrompt: 'Authenticate',
      });
      Alert.alert('Success!', 'Value: ' + value + ', stored successfully for key: ' + key, [
        { text: 'OK', onPress: () => {} },
      ]);
    } catch (e) {
      Alert.alert('Error!', e.message, [{ text: 'OK', onPress: () => {} }]);
    }
  }

  function storeValue(value: string, key: string) {
    try {
      SecureStore.setItem(key, value, {
        keychainService: service,
        requireAuthentication: requireAuth,
        authenticationPrompt: 'Authenticate',
      });
      Alert.alert('Success!', 'Value: ' + value + ', stored successfully for key: ' + key, [
        { text: 'OK', onPress: () => {} },
      ]);
    } catch (e) {
      Alert.alert('Error!', e.message, [{ text: 'OK', onPress: () => {} }]);
    }
  }

  async function getValueAsync(key: string) {
    try {
      const fetchedValue = await SecureStore.getItemAsync(key, {
        keychainService: service,
        requireAuthentication: requireAuth,
        authenticationPrompt: 'Authenticate',
      });
      Alert.alert('Success!', 'Fetched value: ' + fetchedValue, [
        { text: 'OK', onPress: () => {} },
      ]);
    } catch (e) {
      Alert.alert('Error!', e.message, [{ text: 'OK', onPress: () => {} }]);
    }
  }

  function getValue(key: string) {
    try {
      const fetchedValue = SecureStore.getItem(key, {
        keychainService: service,
        requireAuthentication: requireAuth,
        authenticationPrompt: 'Authenticate',
      });
      Alert.alert('Success!', 'Fetched value: ' + fetchedValue, [
        { text: 'OK', onPress: () => {} },
      ]);
    } catch (e) {
      Alert.alert('Error!', e.message, [{ text: 'OK', onPress: () => {} }]);
    }
  }

  async function deleteValue(key: string) {
    try {
      await SecureStore.deleteItemAsync(key, { keychainService: service });
      Alert.alert('Success!', 'Value deleted', [{ text: 'OK', onPress: () => {} }]);
    } catch (e) {
      Alert.alert('Error!', e.message, [{ text: 'OK', onPress: () => {} }]);
    }
  }

  async function runStorageSizeDemo() {
    const parsedBytes = Number.parseInt(byteSize, 10);
    if (!Number.isFinite(parsedBytes) || parsedBytes <= 0) {
      Alert.alert('Invalid size', 'Enter a positive number to generate the test string.');
      return;
    }

    const nearLimitValue = 'a'.repeat(parsedBytes);
    const overLimitValue = 'a'.repeat(parsedBytes + 1);
    const nearLimitKey = `size-demo-${Platform.OS}-safe-${parsedBytes}`;
    const overLimitKey = `size-demo-${Platform.OS}-over-${parsedBytes + 1}`;
    const results: string[] = [`Platform: ${Platform.OS}`];

    try {
      await SecureStore.setItemAsync(nearLimitKey, nearLimitValue, storeOptions);
      results.push(`Successfully stored ${parsedBytes} bytes.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      results.push(`Failed to store ${parsedBytes} bytes: ${message}`);
    }

    try {
      await SecureStore.setItemAsync(overLimitKey, overLimitValue, storeOptions);
      results.push(`Unexpectedly stored ${parsedBytes + 1} bytes without error.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      results.push(`Storing ${parsedBytes + 1} bytes failed with native error: ${message}`);
    }

    try {
      await SecureStore.deleteItemAsync(nearLimitKey, storeOptions);
      await SecureStore.deleteItemAsync(overLimitKey, storeOptions);
    } catch {}

    Alert.alert('SecureStore size demo', results.join('\n\n'));
  }

  return (
    <ScrollView
      style={styles.container}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled">
      <TextInput
        style={styles.textInput}
        placeholder="Enter a key for the value (ex. password)"
        placeholderTextColor={Colors.secondaryText}
        value={key}
        onChangeText={setKey}
      />
      <TextInput
        style={styles.textInput}
        placeholder="Enter a value to store (ex. pw123!)"
        placeholderTextColor={Colors.secondaryText}
        value={value}
        onChangeText={setValue}
      />
      <TextInput
        style={styles.textInput}
        placeholder="Enter a service name (may be blank)"
        placeholderTextColor={Colors.secondaryText}
        value={service}
        onChangeText={setService}
      />
      <Text style={{ marginBottom: 10 }}>
        Can use biometric authentication: {SecureStore.canUseBiometricAuthentication().toString()}
      </Text>
      {SecureStore.canUseBiometricAuthentication() && (
        <View style={styles.authToggleContainer}>
          <Text>Requires authentication:</Text>
          <Switch value={requireAuth} onValueChange={setRequireAuth} />
        </View>
      )}
      {value && key && (
        <ListButton onPress={() => storeValueAsync(value, key)} title="Store value with key" />
      )}
      {key && <ListButton onPress={() => getValueAsync(key)} title="Get value with key" />}
      {value && key && (
        <ListButton
          onPress={() => storeValue(value, key)}
          title="Store value with key synchronously"
        />
      )}
      {key && <ListButton onPress={() => getValue(key)} title="Get value with key synchronously" />}
      {key && <ListButton onPress={() => deleteValue(key)} title="Delete value with key" />}
      <Text style={styles.demoDescription}>
        Enter a byte length to test the storage limit on this platform.
      </Text>
      <TextInput
        style={styles.textInput}
        placeholder="Length in bytes (e.g. 4096)"
        placeholderTextColor={Colors.secondaryText}
        keyboardType="number-pad"
        value={byteSize}
        onChangeText={setByteSize}
      />
      <ListButton onPress={runStorageSizeDemo} title="Run storage size demo" />
    </ScrollView>
  );
}

SecureStoreScreen.navigationOptions = {
  title: 'SecureStore',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  textInput: {
    marginBottom: 10,
    padding: 10,
    height: 40,
    ...Platform.select({
      ios: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 3,
      },
    }),
  },
  authToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  demoDescription: {
    marginTop: 16,
    marginBottom: 8,
    color: Colors.secondaryText,
  },
});
