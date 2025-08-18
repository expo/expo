import { Link, usePathname } from 'expo-router';
import React from 'react';
import { Text, ScrollView, View } from 'react-native';

const ModalLinks = () => {
  const pathname = usePathname();

  return (
    <ScrollView
      style={{ backgroundColor: '#D6EDFF' }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
      contentInsetAdjustmentBehavior="automatic">
      <View>
        <Text>Modals</Text>
        <Text>Current Path: {pathname}</Text>
      </View>
      <Link href="/modal">Normal link: /modal</Link>
      <Link href="/modal">
        <Link.Trigger>Link.Preview: /modal</Link.Trigger>
        <Link.Preview />
      </Link>
      <Link href="/fullScreenModal">
        <Link.Trigger>Link.Preview: /fullScreenModal</Link.Trigger>
        <Link.Preview />
      </Link>
    </ScrollView>
  );
};

export default ModalLinks;
