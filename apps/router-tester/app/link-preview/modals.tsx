import { Link, usePathname } from 'expo-router';
import React from 'react';
import { Text, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ModalLinks = () => {
  const pathname = usePathname();

  return (
    <ScrollView style={{ backgroundColor: '#D6EDFF' }} contentInsetAdjustmentBehavior="automatic">
      <SafeAreaView edges={['left', 'right']} style={{ padding: 16, gap: 16 }}>
        <View>
          <Text>Modals</Text>
          <Text>Current Path: {pathname}</Text>
        </View>
        <Link href="/link-preview/modal">Normal link: /modal</Link>
        <Link href="/link-preview/modal">
          <Link.Trigger>Link.Preview: /modal</Link.Trigger>
          <Link.Preview />
        </Link>
        <Link href="/link-preview/fullScreenModal">
          <Link.Trigger>Link.Preview: /fullScreenModal</Link.Trigger>
          <Link.Preview />
        </Link>
      </SafeAreaView>
    </ScrollView>
  );
};

export default ModalLinks;
