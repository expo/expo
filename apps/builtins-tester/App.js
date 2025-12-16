import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Image, Text, View } from 'react-native';

import React from 'react';

export default function App() {
  console.log('GOTVALUE:', __native__r('native:url'));
  // console.log('GOTVALUE:', __native__r('native:react'));
  // console.error('hey', globalThis.WritableStream);
  return (
    <SafeAreaView style={styles.container}>
      <Text>Runner</Text>
      {/* <Image
        source={__native__r(
          'native:node_modules/react-native/Libraries/LogBox/UI/LogBoxImages/chevron-left.png'
        )}
        style={{ width: 100, height: 100 }}
      /> */}
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
