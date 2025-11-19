import { Link, usePathname, type Href } from 'expo-router';
import React, { use } from 'react';
import { Text, Pressable, ScrollView, View, Switch } from 'react-native';

import { IsProtectedContext } from '../utils/contexts';

const HomeIndex = () => {
  const [isProtected, setIsProtected] = use(IsProtectedContext);
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
      <CaseLink href="/modal" text="Modal" />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text>Is protected?</Text>
        <Switch value={isProtected} onValueChange={setIsProtected} />
      </View>
      <CaseLink href="/protected" text="Protected" />
      <CaseLink href="/1234" text="1234" />
      <CaseLink href="/apple-files" text="Apple Files" />
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
