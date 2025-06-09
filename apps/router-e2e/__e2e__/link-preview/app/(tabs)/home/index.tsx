import { usePathname } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';

import { Links } from '@/__e2e__/link-preview/components/Links';

const HomeIndex = () => {
  const pathname = usePathname();
  const [isToggled, setIsToggled] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: '#fdd' }}>
      <Text>Home - Index</Text>
      <Text>Current Path: {pathname}</Text>
      <Button title="Toggle" onPress={() => setIsToggled((prev) => !prev)} />
      <Text>Is Toggled: {isToggled ? 'Yes' : 'No'}</Text>
      <Links />
    </View>
  );
};

export default HomeIndex;
