import React from 'react';
import { View, StyleSheet, Button } from 'react-native';

import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

// import NativeComponentList from '../native-component-list/App';

TaskManager.defineTask('TEST_TASK', () => {
  console.warn('What the actual?');
  return BackgroundFetch.Result.NoData;
});

console.warn('GLOBALS, man!');

export default function Main() {
  // @ts-ignore

  console.warn('Component, dude!');

  BackgroundFetch.registerTaskAsync('TEST_TASK', { startOnBoot: true });

  async function pressedButton() {
    console.log('Dummying');
  }

  return (
    <View style={styles.container}>
      <Button title="You can click me." onPress={pressedButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
