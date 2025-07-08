import { usePathname } from 'expo-router';
import React from 'react';
import { View, Text } from 'react-native';

const SettingsIndex = () => {
  const pathname = usePathname();

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Text>Settings - Index</Text>
      <Text>Current Path: {pathname}</Text>
    </View>
  );
};

export default SettingsIndex;
