import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, ScrollView, Text } from 'react-native';

export default function Home() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 20, gap: 20 }}>
      <Link href="/zoom-toolbar/image/zoom" asChild>
        <Link.Trigger withAppleZoom>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open with Apple Zoom"
            style={{ alignSelf: 'flex-start' }}>
            <Image source={require('@/assets/frog.jpg')} style={{ width: 160, height: 200 }} />
          </Pressable>
        </Link.Trigger>
      </Link>
      <Link href="/zoom-toolbar/image/standard">
        <Text>Open without zoom</Text>
      </Link>
    </ScrollView>
  );
}
