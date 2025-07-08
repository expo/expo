import { Link, useIsPreview, usePathname } from 'expo-router';
import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HomeOne = () => {
  const pathname = usePathname();
  const isPreview = useIsPreview();
  const { top } = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: top }}>
      <Text>Home - One</Text>
      <Text>Current Path: {pathname}</Text>
      <Text>Is preview: {isPreview ? 'Yes' : 'No'}</Text>
      <Link href="/(tabs)/home/test/one">
        <Link.Trigger>Link.Preview: /(tabs)/home/test/one</Link.Trigger>
        <Link.Preview />
      </Link>
    </View>
  );
};

export default HomeOne;
