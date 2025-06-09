import { usePathname } from 'expo-router';
import React from 'react';
import { View, Text } from 'react-native';

import { Links } from '@/__e2e__/link-preview/components/Links';

const SettingsIndex = () => {
  const pathname = usePathname();

  return (
    <View>
      <Text>Settings - Index</Text>
      <Text>Current Path: {pathname}</Text>
      <Links />
    </View>
  );
};

export default SettingsIndex;
