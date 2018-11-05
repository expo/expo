import React from 'react';
import { Alert, Platform, ScrollView, TextInput, View } from 'react-native';
import { SecureStore } from 'expo';
import ListButton from '../components/ListButton';

export default class SecureStoreScreen extends React.Component {
  static navigationOptions = {
    title: 'SecureStore',
  };

  state = {
    key: null,
    value: null,
  };

  _setValue = async (value, key) => {
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

  _getValue = async key => {
    try {
      const fetchedValue = await SecureStore.getItemAsync(key, {});
      Alert.alert('Success!', 'Fetched value: ' + fetchedValue, [
        { text: 'OK', onPress: () => {} },
      ]);
    } catch (e) {
      Alert.alert('Error!', e.message, [{ text: 'OK', onPress: () => {} }]);
    }
  };

  _deleteValue = async key => {
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
          onChangeText={text =>
            this.setState({
              value: text,
            })}
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
          onChangeText={text =>
            this.setState({
              key: text,
            })}
        />
        <ListButton
          onPress={() => {
            this._setValue(this.state.value, this.state.key);
          }}
          title="Store value with key"
        />
        <ListButton
          onPress={() => {
            this._getValue(this.state.key);
          }}
          title="Get value with key"
        />
        <ListButton
          onPress={() => {
            this._deleteValue(this.state.key);
          }}
          title="Delete value with key"
        />
      </ScrollView>
    );
  }
}
