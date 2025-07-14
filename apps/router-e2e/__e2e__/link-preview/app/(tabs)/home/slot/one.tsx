import { usePathname } from 'expo-router';
import React from 'react';
import { View, Text } from 'react-native';

export default function A() {
  const pathname = usePathname();

  return (
    <View style={{ flex: 1, padding: 10, gap: 10, backgroundColor: '#dfd' }}>
      <Text>One</Text>
      <Text>Current Path: {pathname}</Text>
    </View>
  );
}
