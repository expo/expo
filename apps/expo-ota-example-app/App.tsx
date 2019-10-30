import React, { useEffect } from 'react';
import { StyleSheet, Button, View, Text, Alert } from 'react-native';
import * as OTA from 'expo-ota';

export default function App() {
  useEffect(() => {
    console.log('They say it is registered. Is it?');
    OTA.addListener(event => {
      console.log('OTA Event: ', event);
    });
  }, []);

  const checkForUpdates = async () => {
    console.warn(Object.keys(OTA));
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
    OTA.fetchUpdateAsync()
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
      <Text>Version 1.0.109</Text>
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
