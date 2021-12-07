import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import * as React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { Page, Section } from '../components/Page';

const key = 'random_value';

function PersistExample() {
  const [storedNumber, setStoredNumber] = React.useState('0');

  React.useEffect(() => {
    getItem();
  }, []);

  const getItem = React.useCallback(async () => {
    const value = await AsyncStorage.getItem(key);
    if (value) {
      setStoredNumber(value);
    } else {
      setStoredNumber('0');
    }
  }, [setStoredNumber]);

  const increment = React.useCallback(async () => {
    const newNumber = +storedNumber > 0 ? +storedNumber + 10 : 10;

    await AsyncStorage.setItem(key, `${newNumber}`);

    setStoredNumber(`${newNumber}`);
  }, [setStoredNumber, storedNumber]);

  const clearItem = React.useCallback(async () => {
    await AsyncStorage.removeItem(key);
    await getItem();
  }, [getItem]);

  return (
    <View>
      <Text style={styles.text}>Current: {storedNumber}</Text>
      <Button title="Increment by 10" onPress={increment} />
      <Button title="Reset" onPress={clearItem} />

      <Button onPress={() => Updates.reloadAsync()} title="Reload App" />
    </View>
  );
}

export default function AsyncStorageScreen() {
  return (
    <Page>
      <Section title="Persist Data">
        <PersistExample />
      </Section>
    </Page>
  );
}

AsyncStorageScreen.navigationOptions = {
  title: 'AsyncStorage',
};

const styles = StyleSheet.create({
  text: {
    color: '#000000',
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
});
