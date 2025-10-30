import { Link, usePathname, type Href } from 'expo-router';
import React, { use, type Ref } from 'react';
import { Text, Pressable, ScrollView, View } from 'react-native';
import { TagContext } from '../components/tagContenxt';

const HomeIndex = () => {
  const pathname = usePathname();
  const [_, setTag] = use(TagContext);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={{ alignItems: 'center', gap: 16 }}
      contentInsetAdjustmentBehavior="automatic">
      <View>
        <Text>Home - Index</Text>
        <Text>Current Path: {pathname}</Text>
      </View>
      <CaseLink href="/js-only" text="JS Only" />
      <CaseLink href="/js-only/tabs" text="JS Only Tabs" />
      <CaseLink href="/modals" text="Modals" />
      <CaseLink
        ref={(ref) => {
          console.log(ref?.__nativeTag);
          setTag(ref?.__nativeTag ?? 0);
        }}
        href="/misc"
        text="Misc"
      />
      <CaseLink href="/menu" text="Menu" />
      <CaseLink href="/nested" text="Nested" />
      <CaseLink href="/performance" text="Performance" />
      <CaseLink href="/param" text="Param" />
    </ScrollView>
  );
};

function CaseLink({ href, text, ref }: { href: Href; text: string; ref?: Ref<View> }) {
  return (
    <Link href={href} asChild>
      <Pressable
        ref={ref}
        style={{ backgroundColor: 'rgb(11, 103, 175)', padding: 16, borderRadius: 8 }}>
        <Text style={{ color: '#fff' }}>{text}</Text>
      </Pressable>
    </Link>
  );
}

export default HomeIndex;
