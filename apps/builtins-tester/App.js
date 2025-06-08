import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import React from 'react';

export default function App() {
  // console.log("GOTVALUE:", __native__r("native:react"));
  // console.log(
  //   "GOTVALUE:",
  //   __r("TICKLEBACON"),
  //   [...__r.getModules().keys()],
  //   React._expo_builtin
  // );
  // console.log("h", React._expo_builtin);

  console.error('hey');
  return (
    <SafeAreaView style={styles.container}>
      <Text>Runner!</Text>

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff0ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
