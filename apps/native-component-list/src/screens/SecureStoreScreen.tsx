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
});
