import { Image, useImage } from 'expo-image';
import { useState } from 'react';
import { PixelRatio, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/utils/theme';

// Load the same large source as the "Too big" page, but constrain decoding to the rendered box size
// in device pixels with `maxWidth`/`maxHeight`. The decoded image stays well within the screen
// budget, so no `expo-image.oversized` warning is logged. This is the recommended pattern.
const SIZE = 220;
const PIXELS = Math.round(SIZE * PixelRatio.get());
const SOURCE = 'https://picsum.photos/seed/expo-image-correct/4000/4000';

export default function CorrectImage() {
  const theme = useTheme();
  const [failed, setFailed] = useState(false);
  const image = useImage(SOURCE, {
    maxWidth: PIXELS,
    maxHeight: PIXELS,
    onError: () => setFailed(true),
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background.screen }]}
      contentContainerStyle={styles.content}>
      {image ? <Image style={styles.image} source={image} /> : null}
      <Text style={[styles.heading, { color: theme.text.default }]}>Correctly sized</Text>
      <Text style={[styles.body, { color: theme.text.secondary }]}>
        Rendered at {SIZE}×{SIZE}pt and decoded to at most {PIXELS}×{PIXELS}px with `maxWidth`/
        `maxHeight`. Decoded:{' '}
        {image ? `${image.width * image.scale}×${image.height * image.scale}px` : '…'}. No
        `expo-image.oversized` warning is logged.
      </Text>
      {failed ? (
        <Text style={[styles.body, { color: theme.text.secondary }]}>Failed to load the image.</Text>
      ) : null}
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
