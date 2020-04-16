import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
const uri = 'https://s3.amazonaws.com/exp-icon-assets/ExpoEmptyManifest_192.png';

export default function App() {
  return (
    <View style={styles.container}>
      <Image style={{ width: 192, height: 192 }} source={{ uri }} />

      {/* Adjust the tint and intensity */}
      <BlurView tint="light" intensity={50} style={styles.notBlurred}>
        <Image style={{ width: 96, height: 96 }} source={{ uri }} />
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notBlurred: {
    ...StyleSheet.absoluteFill,
    top: Constants.statusBarHeight,
  },
});
