import { Link, usePathname } from 'expo-router';
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HomeIndex = () => {
  const pathname = usePathname();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#ACD7EC' }}
      contentInsetAdjustmentBehavior="automatic">
      <SafeAreaView edges={['left', 'right']}>
        <Text>JS Only cases</Text>
        <Text>Current Path: {pathname}</Text>
        <Spacer />
        <Link href="/link-preview/js-only/slot">
          <Link.Trigger>Link.Preview: /js-only/slot</Link.Trigger>
          <Link.Preview />
        </Link>
      </SafeAreaView>
    </ScrollView>
  );
};

const Spacer = () => (
  <View
    style={{
      width: '100%',
      height: 16,
    }}
  />
);

export default HomeIndex;
