import * as SecureStore from 'expo-secure-store';
import * as React from 'react';
import { Alert, Platform, ScrollView, Text, TextInput, View, Switch } from 'react-native';
import ListButton from '../components/ListButton';
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
  const [requireAuth, setRequireAuth] = React.useState<boolean | undefined>();

  const _toggleAuth = async () => { setRequireAuth(!requireAuth); };

  const _setValue = async (value: string, key: string) => {
    try {
      console.log('SecureStore: ' + SecureStore);
      await SecureStore.setItemAsync(key, value, { keychainService: service, requireAuthentication: requireAuth, authenticationPrompt: "Authenticate" });
      Alert.alert('Success!', 'Value: ' + value + ', stored successfully for key: ' + key, [
        { text: 'OK', onPress: () => {} },
      ]);
    } catch (e) {
      Alert.alert('Error!', e.message, [{ text: 'OK', onPress: () => {} }]);
    }
  };

  const _getValue = async (key: string) => {
    try {
      const fetchedValue = await SecureStore.getItemAsync(key, { keychainService: service, requireAuthentication: requireAuth, authenticationPrompt: "Authenticate" });
      Alert.alert('Success!', 'Fetched value: ' + fetchedValue, [
        { text: 'OK', onPress: () => {} },
      ]);
    } catch (e) {
      Alert.alert('Error!', e.message, [{ text: 'OK', onPress: () => {} }]);
    }
  };

  const _deleteValue = async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key, { keychainService: service });
      Alert.alert('Success!', 'Value deleted', [{ text: 'OK', onPress: () => {} }]);
    } catch (e) {
      Alert.alert('Error!', e.message, [{ text: 'OK', onPress: () => {} }]);
    }
  };

  return (
    <ScrollView
      style={{
        flex: 1,
        padding: 10,
      }}>
      <TextInput
        style={{
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
        }}
        placeholder="Enter a value to store (ex. pw123!)"
        value={value}
        onChangeText={setValue}
      />
      <TextInput
        style={{
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
        }}
        placeholder="Enter a key for the value (ex. password)"
        value={key}
        onChangeText={setKey}
      />
      <TextInput
        style={{
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
        }}
        placeholder="Enter a service name (may be blank)"
        value={service}
        onChangeText={setService}
      />
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text>Requires authentication:</Text>
        <Switch value={requireAuth} onValueChange={_toggleAuth} />
      </View>
      {value && key && (
        <ListButton onPress={() => _setValue(value, key)} title="Store value with key" />
      )}
      {key && <ListButton onPress={() => _getValue(key)} title="Get value with key" />}
      {key && <ListButton onPress={() => _deleteValue(key)} title="Delete value with key" />}
    </ScrollView>
  );
}

SecureStoreScreen.navigationOptions = {
  title: 'SecureStore',
};
