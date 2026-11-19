import { Link, useLocalSearchParams, usePathname } from 'expo-router';
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ParamScreen() {
  const pathname = usePathname();
  const { param } = useLocalSearchParams();

  return (
    <ScrollView style={{ backgroundColor: '#84DCC6' }} contentInsetAdjustmentBehavior="automatic">
      <SafeAreaView edges={['left', 'right']} style={{ padding: 16, gap: 16 }}>
        <View>
          <Text>Misc</Text>
          <Text>Current Path: {pathname}</Text>
          <Text>Param: {param}</Text>
        </View>
        <Link href="/link-preview/another-param">
          <Link.Trigger>Link.Preview: /another-param</Link.Trigger>
          <Link.Preview />
        </Link>
        <Link href="/link-preview/one-more-param">
          <Link.Trigger>Link.Preview: /one-more-param</Link.Trigger>
          <Link.Preview />
        </Link>
      </SafeAreaView>
    </ScrollView>
  );
}
