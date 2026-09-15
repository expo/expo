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
        <Text>Params</Text>
        <Text>Current Path: {pathname}</Text>
      </View>
      <CaseLink href="/params/123" text="/params/123" />
      <CaseLink href="/params/123?a=x&b=0" text="/params/123?a=x&b=0" />
      <CaseLink
        href={{
          pathname: '/params/[path]',
          params: { a: 'x', b: '0', path: '123' },
        }}
        text="/params/123?a=x&b=0 object"
      />
      <CaseLink href="/params/456/aaa?x=1&y=2" text="/params/456/aaa?x=1&y=2" />
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
