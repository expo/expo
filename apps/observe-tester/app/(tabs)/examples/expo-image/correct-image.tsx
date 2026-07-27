import { Image, type ImageLoadEventData } from 'expo-image';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/utils/theme';

// A declarative `<Image>` never goes through `Image.loadAsync` — the native view loads it and the
// integration is fed from the view's `onLoad` decoded size. The source here is sized for display,
// so its decoded size stays well within the screen budget on both platforms and no
// `expo-image.oversized` warning is logged. (Note: on iOS `onLoad` reports the size before
// downscaling, so shrinking a huge source with a small box or `allowDownscaling` does NOT avoid the
// warning there — fetch a sensibly sized source instead, as below.)
const SIZE = 220;
const SOURCE = 'https://picsum.photos/seed/expo-image-view-ok/600/600';

export default function CorrectImageView() {
  const theme = useTheme();
  const [decoded, setDecoded] = useState<{ width: number; height: number } | null>(null);

  const onLoad = (event: ImageLoadEventData) => {
    setDecoded({ width: event.source.width, height: event.source.height });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background.screen }]}
      contentContainerStyle={styles.content}>
      <Image style={styles.image} source={SOURCE} onLoad={onLoad} />
      <Text style={[styles.heading, { color: theme.text.default }]}>Correct (&lt;Image&gt;)</Text>
      <Text style={[styles.body, { color: theme.text.secondary }]}>
        A 600×600px source rendered in a {SIZE}×{SIZE}pt box. Decoded:{' '}
        {decoded ? `${decoded.width}×${decoded.height}px` : '…'} — well within the screen budget, so
        no `expo-image.oversized` warning is logged.
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
