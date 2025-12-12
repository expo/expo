import { Link, usePathname, type Href } from 'expo-router';
import React from 'react';
import { Text, Pressable, ScrollView, View } from 'react-native';

const HomeIndex = () => {
  const pathname = usePathname();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={{ alignItems: 'center', gap: 16 }}
      contentInsetAdjustmentBehavior="automatic">
      <View>
        <Text>Native navigation - Index</Text>
        <Text>Current Path: {pathname}</Text>
      </View>
      <CaseLink href="/tabs" text="Native Tabs" />
      <CaseLink href="/toolbar" text="Toolbar" />
    </ScrollView>
  );
};

function CaseLink({ href, text }: { href: Href; text: string }) {
  return (
    <Link href={href} asChild>
      <Pressable style={{ backgroundColor: 'rgb(11, 103, 175)', padding: 16, borderRadius: 8 }}>
        <Text style={{ color: '#fff' }}>{text}</Text>
      </Pressable>
    </Link>
  );
}

export default HomeIndex;
