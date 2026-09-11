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
        <Text>Home - Index</Text>
        <Text>Current Path: {pathname}</Text>
      </View>
      <CaseLink href="/link-preview/js-only" text="JS Only" />
      <CaseLink href="/link-preview/js-only/tabs" text="JS Only Tabs" />
      <CaseLink href="/link-preview/modals" text="Modals" />
      <CaseLink href="/link-preview/misc" text="Misc" />
      <CaseLink href="/link-preview/menu" text="Menu" />
      <CaseLink href="/link-preview/nested" text="Nested" />
      <CaseLink href="/link-preview/performance" text="Performance" />
      <CaseLink href="/link-preview/param" text="Param" />
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
