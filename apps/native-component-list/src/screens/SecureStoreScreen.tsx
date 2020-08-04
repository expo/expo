import * as SecureStore from 'expo-secure-store';
import React from 'react';
import { Alert, Platform, ScrollView, TextInput } from 'react-native';

import ListButton from '../components/ListButton';

interface State {
  key?: string;
  value?: string;
}

export default class SecureStoreScreen extends React.Component<object, State> {
  static navigationOptions = {
    title: 'SecureStore',
  };

  readonly state: State = {};

  _setValue = async (value: string, key: string) => {
    try {
      console.log('securestore: ' + SecureStore);
      await SecureStore.setItemAsync(key, value, {});
      Alert.alert('Success!', 'Value: ' + value + ', stored successfully for key: ' + key, [
        { text: 'OK', onPress: () => {} },
      ]);
    } catch (e) {
      Alert.alert('Error!', e.message, [{ text: 'OK', onPress: () => {} }]);
    }
  };

  _getValue = async (key: string) => {
    try {
      const fetchedValue = await SecureStore.getItemAsync(key, {});
      Alert.alert('Success!', 'Fetched value: ' + fetchedValue, [
        { text: 'OK', onPress: () => {} },
      ]);
    } catch (e) {
      Alert.alert('Error!', e.message, [{ text: 'OK', onPress: () => {} }]);
    }
  };

  _deleteValue = async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key, {});
      Alert.alert('Success!', 'Value deleted', [{ text: 'OK', onPress: () => {} }]);
    } catch (e) {
      Alert.alert('Error!', e.message, [{ text: 'OK', onPress: () => {} }]);
    }
  };

  render() {
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
          value={this.state.value}
          onChangeText={value => this.setState({ value })}
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
          value={this.state.key}
          onChangeText={key => this.setState({ key })}
        />
        {this.state.value && this.state.key && (
          <ListButton
            onPress={() => this._setValue(this.state.value!, this.state.key!)}
            title="Store value with key"
          />
        )}
        {this.state.key && (
          <ListButton onPress={() => this._getValue(this.state.key!)} title="Get value with key" />
        )}
        {this.state.key && (
          <ListButton
            onPress={() => this._deleteValue(this.state.key!)}
            title="Delete value with key"
          />
        )}
      </ScrollView>
    );
  }
}
