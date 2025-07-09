import '@expo/metro-runtime';

import React from 'react';
import { Text } from 'react-native';

export default function App() {
  return (
    <>
      <Text testID="env-var">{process.env.EXPO_PUBLIC_VALUE}</Text>
      <Text testID="env-var-inline">{process.env.EXPO_PUBLIC_VALUE_INLINE}</Text>
    </>
  );
}
