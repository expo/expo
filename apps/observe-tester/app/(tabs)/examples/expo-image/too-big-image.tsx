import { Image, type ImageLoadEventData } from 'expo-image';
import { useState } from 'react';
import { Dimensions, PixelRatio, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/utils/theme';

// A declarative `<Image>` never goes through `Image.loadAsync` — the native view loads it and the
// integration is fed from the view's `onLoad` decoded size. `allowDownscaling={false}` keeps the
// full 4000×4000 bitmap on Android (where downscaling otherwise shrinks the decode to the box). On
// iOS `onLoad` already reports the full pre-downscale size, so it warns regardless. Either way the
// decoded size far exceeds the screen and an `expo-image.oversized` warning is logged.
const SIZE = 220;
const SOURCE = 'https://picsum.photos/seed/expo-image-view-big/4000/4000';

export default function TooBigImageView() {
  const theme = useTheme();
  const [decoded, setDecoded] = useState<{ width: number; height: number } | null>(null);
  const screen = Dimensions.get('screen');

  const onLoad = (event: ImageLoadEventData) => {
    setDecoded({ width: event.source.width, height: event.source.height });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background.screen }]}
      contentContainerStyle={styles.content}>
      <Image style={styles.image} source={SOURCE} allowDownscaling={false} onLoad={onLoad} />
      <Text style={[styles.heading, { color: theme.text.default }]}>Too big (&lt;Image&gt;)</Text>
      <Text style={[styles.body, { color: theme.text.secondary }]}>
        A 4000×4000px source rendered with `allowDownscaling={'{false}'}`. Decoded:{' '}
        {decoded ? `${decoded.width}×${decoded.height}px` : '…'} — far beyond the screen (
        {Math.round(screen.width)}×{Math.round(screen.height)}pt @{PixelRatio.get()}x), so an
        `expo-image.oversized` warning is logged. Check the Sessions tab.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: Platform.select({ ios: 30, android: 150 }),
  },
  image: {
    width: SIZE,
    height: SIZE,
    borderRadius: 8,
    marginBottom: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
  },
});
