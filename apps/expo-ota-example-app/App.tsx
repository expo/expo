import React from 'react';
import { StyleSheet, Button, View, Text, ToastAndroid, Alert } from 'react-native';
import { NativeModulesProxy } from '@unimodules/core';

const OTA = NativeModulesProxy.ExpoOta;

export default function App() {
  const checkForUpdates = async () => {
    const value = OTA.checkForUpdateAsync();
    value
      .then(result => {
        Alert.alert('Result: ', `${JSON.stringify(result)}`);
      })
      .catch(e => {
        Alert.alert('Error!', `${JSON.stringify(e)}`);
      });
  };

  const fetchUpdates = () => {
    OTA.fetchUpdatesAsync()
      .then(result => {
        Alert.alert('Result: ', `${JSON.stringify(result)}`);
      })
      .catch(e => {
        Alert.alert('Error!', `${JSON.stringify(e)}`);
      });
  };

  const reload = () => {
    OTA.reload()
      .then(result => {
        Alert.alert('Result: ', `${JSON.stringify(result)}`);
      })
      .catch(error => {
        Alert.alert('Error!: ', `${JSON.stringify(error)}`);
      });
  };

  const clearCache = () => {
    OTA.clearUpdateCacheAsync().then(result => {
      Alert.alert('Result: ', `${JSON.stringify(result)}`);
    });
  };

  const manifest = () => {
    OTA.readCurrentManifestAsync().then(result => {
      Alert.alert('Result: ', `${JSON.stringify(result)}`);
    });
  };

  return (
    <View style={styles.container}>
      <Button title={'Download manifest'} onPress={checkForUpdates} />
      <View style={{ height: 10 }} />
      <Button title={'Update if available'} onPress={fetchUpdates} />
      <View style={{ height: 10 }} />
      <Button title={'Clear'} onPress={clearCache} />
      <View style={{ height: 10 }} />
      <Button title={'Reload'} onPress={reload} />
      <View style={{ height: 10 }} />
      <Button title={'Current manifest'} onPress={manifest} />
      <View style={{ height: 10 }} />
      <Text>Version 1.0.104</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    margin: 8,
  },
});
