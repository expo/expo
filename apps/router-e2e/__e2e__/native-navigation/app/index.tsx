import { Image } from 'expo-image';
import { Color, Link, Stack, usePathname, type Href } from 'expo-router';
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
      <CaseLink href="/modals" text="Modals" />
      <CaseLink href="/params" text="Params" />

      <Stack.Toolbar>
        {/* <Stack.Toolbar.Link href="/header-items" icon="arrow.2.circlepath.circle.fill">
          Hey
        </Stack.Toolbar.Link> */}
        <Stack.Toolbar.View>
          <View
            style={{
              paddingHorizontal: 16,
              flexDirection: 'row',
              width: 128,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}>
            <Image
              source={'sf:square.3.layers.3d.down.right'}
              style={{
                fontSize: 24,
                color: Color.ios.secondaryLabel,
              }}
            />
            <Text
              style={{
                color: Color.ios.secondaryLabel,
              }}>
              Layers
            </Text>
            <Image
              source={'sf:arrow.up.and.down'}
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: Color.ios.systemFill,
              }}
            />
          </View>
        </Stack.Toolbar.View>
        <Stack.Toolbar.Spacer />
      </Stack.Toolbar>
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
