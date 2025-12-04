import { Link, useLocalSearchParams, usePathname } from 'expo-router';
import React from 'react';
import { View, Text, ScrollView } from 'react-native';

export default function ParamScreen() {
  const pathname = usePathname();
  const { param } = useLocalSearchParams();

  return (
    <ScrollView
      style={{ backgroundColor: '#84DCC6' }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
      contentInsetAdjustmentBehavior="automatic">
      <View>
        <Text>Misc</Text>
        <Text>Current Path: {pathname}</Text>
        <Text>Param: {param}</Text>
      </View>
      <Link href="/another-param">
        <Link.Trigger>Link.Preview: /another-param</Link.Trigger>
        <Link.Preview />
      </Link>
      <Link href="/one-more-param">
        <Link.Trigger>Link.Preview: /one-more-param</Link.Trigger>
        <Link.Preview />
      </Link>
      <Link href="/one-more-param?a=123">
        <Link.Trigger>Link.Preview: /one-more-param?a=123</Link.Trigger>
        <Link.Preview />
      </Link>
      <Link href="/?param=one-more-param&a=123">
        <Link.Trigger>Link.Preview: /?param=one-more-param&a=123</Link.Trigger>
        <Link.Preview />
      </Link>
    </ScrollView>
  );
}
