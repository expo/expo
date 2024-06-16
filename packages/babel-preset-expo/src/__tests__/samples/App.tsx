import { Ionicons } from '@expo/vector-icons';
import AppLoading from 'expo-app-loading';
import { Asset } from 'expo-asset';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

export default function App() {
  const [assetsAreLoaded, setAssetsAreLoaded] = useState(false);

  useEffect(() => {
    loadAssetsAsync(setAssetsAreLoaded);
  }, []);

  if (!assetsAreLoaded) {
    return <AppLoading />;
  }

  return !assetsAreLoaded ? (
    <AppLoading />
  ) : (
    <View style={styles.container}>
      <Ionicons name="md-options" size={28} />
    </View>
  );
}

async function loadAssetsAsync(
  setAssetsAreLoaded: React.Dispatch<React.SetStateAction<boolean>>
): Promise<void> {
  try {
    await Asset.loadAsync([require('./assets/icon.png')]);
  } finally {
    setAssetsAreLoaded(true);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
