import { Image, useImage } from 'expo-image';
import { useState } from 'react';
import { Dimensions, PixelRatio, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/utils/theme';

// The criterion is screen-relative: `width*height > screenWidth*screenHeight*pixelRatio²*1.5`. A
// 2370×2370px image (5.62M px) sits between a phone's budget (~4.5–5.4M on common phones) and a
// tablet's (~5.8M and up), so it's flagged on a phone but not on an iPad — same image, same code,
// different verdict by device. The margin against the smallest iPads is ~0.2M px, and numbers are
// approximate and vary by exact screen size.
const SIZE = 200;
const IMAGE_PX = 2370;
const SOURCE = `https://picsum.photos/seed/expo-image-phone/${IMAGE_PX}/${IMAGE_PX}`;

export default function TooBigPhone() {
  const theme = useTheme();
  const [failed, setFailed] = useState(false);
  const image = useImage(SOURCE, { onError: () => setFailed(true) });
  const screen = Dimensions.get('screen');
  const scale = PixelRatio.get();
  const budget = Math.round(screen.width * screen.height * scale * scale * 1.5);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background.screen }]}
      contentContainerStyle={styles.content}>
      {image ? <Image style={styles.image} source={image} /> : null}
      <Text style={[styles.heading, { color: theme.text.default }]}>Too big on phone</Text>
      <Text style={[styles.body, { color: theme.text.secondary }]}>
        A {IMAGE_PX}×{IMAGE_PX}px image ({(IMAGE_PX * IMAGE_PX).toLocaleString()}px²) loaded with
        `useImage`. This device's threshold is {budget.toLocaleString()}px² (
        {Math.round(screen.width)}×{Math.round(screen.height)}pt @{scale}x² × 1.5). On a phone the
        image exceeds it and an `expo-image.oversized` warning is logged; on an iPad the same image
        is within budget and no warning fires.
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
