import { usePathname } from 'expo-router';
import React from 'react';
import { View, Text } from 'react-native';

const HomeOne = () => {
  const pathname = usePathname();

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Text>Home - One</Text>
      <Text>Current Path: {pathname}</Text>
    </View>
  );
};

export default HomeOne;
