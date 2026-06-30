import { Image, useImage } from 'expo-image';
import { useState } from 'react';
import { Dimensions, PixelRatio, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/utils/theme';

// Load a very large remote image with no size constraints. The loader compares its decoded pixel
// area against the screen budget (screen point area × pixel ratio² × 1.5) and logs an
// `expo-image.oversized` warning because it is far beyond what any full-screen image needs. Use
// `maxWidth`/`maxHeight` (see the "Correctly sized" page) to avoid this.
const SIZE = 220;
const SOURCE = 'https://picsum.photos/seed/expo-image-too-big/4000/4000';

export default function TooBigImage() {
  const theme = useTheme();
  const [failed, setFailed] = useState(false);
  const image = useImage(SOURCE, { onError: () => setFailed(true) });
  const screen = Dimensions.get('screen');

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background.screen }]}
      contentContainerStyle={styles.content}>
      {image ? <Text>Image loaded</Text> : null}
      <Text style={[styles.heading, { color: theme.text.default }]}>Too big</Text>
      <Text style={[styles.body, { color: theme.text.secondary }]}>
        A 4000×4000px image loaded with no size constraints. Decoded:{' '}
        {image ? `${image.width * image.scale}×${image.height * image.scale}px` : '…'} — far beyond
        this device's screen ({Math.round(screen.width)}×{Math.round(screen.height)}pt @
        {PixelRatio.get()}x), so an `expo-image.oversized` warning is logged. Check the Sessions
        tab.
      </Text>
      {failed ? (
        <Text style={[styles.body, { color: theme.text.secondary }]}>
          Failed to load the image.
        </Text>
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
