import { Link, usePathname, type Href } from 'expo-router';
import React, { useEffect } from 'react';
import { Text, Pressable, ScrollView, View } from 'react-native';

const HomeIndex = () => {
  const pathname = usePathname();

  useEffect(() => {
    console.log(
      'globalThis.expo.router',
      globalThis.expo?.router?.currentPathname,
      globalThis.expo?.router?.currentParams
    );
  }, []);

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
      <CaseLink href="/header-items" text="Header Items" />
      <CaseLink href="/composition-lifecycle" text="Composition Lifecycle" />
      <CaseLink href="/composition-conflicts" text="Composition Conflicts" />
      <CaseLink href="/composition-rerenders" text="Composition Rerenders" />
      <CaseLink href="/modals" text="Modals" />
      <CaseLink href="/params" text="Params" />
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
