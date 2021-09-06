import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import * as React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { Page, Section } from '../components/Page';

const key = 'random_value';

function PersistExample() {
  const [storedNumber, setStoredNumber] = React.useState('');
  const [needsRestart, setNeedsRestart] = React.useState(false);

  React.useEffect(() => {
    AsyncStorage.getItem(key).then((value) => {
      if (value) {
        setStoredNumber(value);
      }
    });
  }, []);

  const increment = React.useCallback(async () => {
    const newNumber = +storedNumber > 0 ? +storedNumber + 10 : 10;

    await AsyncStorage.setItem(key, `${newNumber}`);

    setStoredNumber(`${newNumber}`);
    setNeedsRestart(true);
  }, [setNeedsRestart, setStoredNumber, storedNumber]);

  const clearItem = React.useCallback(async () => {
    await AsyncStorage.removeItem(key);
    setNeedsRestart(true);
  }, [setNeedsRestart]);

  return (
    <View>
      <Text style={styles.text}>Current: {storedNumber}</Text>
      <Button title="Increment by 10" onPress={increment} />
      <Button title="Reset" onPress={clearItem} />

      {needsRestart ? <Button onPress={() => Updates.reloadAsync()} title="Reload App" /> : null}
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
