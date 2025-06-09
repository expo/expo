import { Link, useIsPreview } from 'expo-router';
import { View } from 'react-native';

export function Links() {
  const isPreview = useIsPreview();
  return (
    <View style={{ gap: 10, marginTop: 10 }}>
      <Link href="/" experimentalPreview>
        /
      </Link>
      <Link href="/(tabs)/home" experimentalPreview>
        /(tabs)/home
      </Link>
      <Link href="/(tabs)/home/one" experimentalPreview>
        /(tabs)/home/one
      </Link>
      <Link href="/(tabs)/home/two" experimentalPreview>
        /(tabs)/home/two
      </Link>
      <Link href="/(tabs)/home/two" experimentalPreview experimentalDisableLazyPreview>
        disableLazyPreview: /(tabs)/home/two
      </Link>
      <Link href="/(tabs)/home/two" experimentalPreview push>
        Push: /(tabs)/home/two
      </Link>
      <Link
        href="/(tabs)/home/two"
        experimentalPreview
        style={{
          backgroundColor: 'transparent',
        }}>
        Transparent: /(tabs)/home/two
      </Link>
      <Link
        href="/(tabs)/home/two"
        experimentalPreview
        style={{
          backgroundColor: isPreview ? 'transparent' : 'red',
        }}>
        Red: /(tabs)/home/two (transparent in preview)
      </Link>
      <Link href="/(tabs)/home/hello_world" experimentalPreview>
        /(tabs)/home/hello_world
      </Link>
      <Link href="/(tabs)/home/hello_world" experimentalPreview push>
        Push: /(tabs)/home/hello_world
      </Link>
      <Link href="/(tabs)/settings" experimentalPreview>
        /(tabs)/settings
      </Link>
      <Link href="/settings" experimentalPreview>
        /settings
      </Link>
    </View>
  );
}
