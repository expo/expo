import { Link, Stack, type Href } from 'expo-router';
import { PlatformColor, ScrollView, Text } from 'react-native';

export function SettingsStackScreen({ title, links }: { title: string; links: Href[] }) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 20, gap: 8 }}>
      <Stack.Screen options={{ title }} />
      <Text>{title}</Text>
      {links.map((href) => (
        <Link
          key={String(href)}
          href={href}
          push
          style={{ fontSize: 17, color: PlatformColor('link') }}>
          {String(href)}
        </Link>
      ))}
    </ScrollView>
  );
}
