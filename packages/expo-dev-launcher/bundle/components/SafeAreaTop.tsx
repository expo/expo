import { View } from 'expo-dev-client-components';
import * as React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function SafeAreaTop() {
  const { top } = useSafeAreaInsets();
  return <View style={{ height: top }} />;
}
