import { Link, usePathname, type Href } from 'expo-router';
import { Material3DynamicColor } from 'expo-system-ui';
import React from 'react';
import {
  Text,
  Pressable,
  ScrollView,
  View,
  PlatformColor,
  useColorScheme,
  Button,
  Appearance,
} from 'react-native';

const squares = [
  '?attr/expoMaterialPrimary',
  '?attr/expoMaterialSecondary',
  '?attr/expoMaterialTertiary',
  '?attr/expoMaterialSurfaceContainer',
  '?attr/expoMaterialSurface',
];

const HomeIndex = () => {
  const pathname = usePathname();
  const scheme = useColorScheme(); // to trigger re-render on theme change

  const m3 = [
    Material3DynamicColor('Primary'),
    Material3DynamicColor('Secondary'),
    Material3DynamicColor('Tertiary'),
    Material3DynamicColor('SurfaceContainer'),
    Material3DynamicColor('Surface'),
  ];

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: Material3DynamicColor('Surface'),
      }}
      contentContainerStyle={{ alignItems: 'center', gap: 16 }}
      contentInsetAdjustmentBehavior="automatic">
      <View>
        <Text>Home - Index</Text>
        <Text>Current Path: {pathname}</Text>
      </View>
      <Button
        title="Toggle color scheme"
        onPress={() => {
          Appearance.setColorScheme(Appearance.getColorScheme() === 'dark' ? 'light' : 'dark');
        }}
      />
      <Button
        title="Set color scheme to null"
        onPress={() => {
          Appearance.setColorScheme('unspecified');
        }}
      />
      <View style={{ width: '100%', flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
        {squares.map((color, index) => (
          <View
            key={`${index}-${scheme}`}
            style={{
              backgroundColor: PlatformColor(color, '#F00'),
              flex: 1,
              aspectRatio: 1,
              borderRadius: 8,
            }}
          />
        ))}
      </View>
      <View style={{ width: '100%', flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
        {m3.map((color, index) => (
          <View
            key={`${index}-${scheme}`}
            style={{ backgroundColor: color, flex: 1, aspectRatio: 1, borderRadius: 8 }}
          />
        ))}
      </View>
      <CaseLink href="/js-only" text="JS Only" />
      <CaseLink href="/js-only/tabs" text="JS Only Tabs" />
      <CaseLink href="/modals" text="Modals" />
      <CaseLink href="/misc" text="Misc" />
      <CaseLink href="/menu" text="Menu" />
      <CaseLink href="/nested" text="Nested" />
      <CaseLink href="/performance" text="Performance" />
      <CaseLink href="/param" text="Param" />
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
