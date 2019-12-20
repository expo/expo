import React from 'react';
import { View, StyleSheet, Button } from 'react-native';

import * as TaskManager from 'expo-task-manager';

// import NativeComponentList from '../native-component-list/App';

console.log('Log it globally motherfucker');

export default function Main() {
  // @ts-ignore

  async function pressedButton() {
    console.log('Dummying');
    TaskManager.dummy();
  }

  return (
    <View style={styles.container}>
      <Button title="hit me baby one more time" onPress={pressedButton} />
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
