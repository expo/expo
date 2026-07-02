import { router } from 'expo-router';
import { Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { useTheme } from '@/utils/theme';

export default function ExpoImageIndex() {
  const theme = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background.screen }]}
      contentContainerStyle={styles.content}>
      <Text style={[styles.body, { color: theme.text.secondary }]}>
        The `expo-image` integration logs a warning when an image is decoded far larger than the
        screen needs, across every loading path: `Image.loadAsync`/`useImage` and declarative{' '}
        {'`<Image>`'}. Enabled in the root layout with{' '}
        {`integrations: { 'expo-image': { oversizeThreshold: 1.5 } }`}. Open a page below, then
        check the Sessions tab for an `expo-image.oversized` log.
      </Text>

      <Text style={[styles.section, { color: theme.text.default }]}>useImage / loadAsync</Text>
      <Button
        title="Correctly sized"
        description="Decoding constrained with maxWidth/maxHeight — no warning"
        onPress={() => router.push('/examples/expo-image/correct')}
      />
      <Button
        title="Too big"
        description="A huge source loaded unconstrained — logs a warning"
        onPress={() => router.push('/examples/expo-image/too-big')}
      />

      <Text style={[styles.section, { color: theme.text.default }]}>{'Declarative <Image>'}</Text>
      <Button
        title="Correct (<Image>)"
        description="Default downscaling keeps it in budget — no warning"
        onPress={() => router.push('/examples/expo-image/correct-image')}
      />
      <Button
        title="Too big (<Image>)"
        description="allowDownscaling=false keeps the full bitmap — logs a warning"
        onPress={() => router.push('/examples/expo-image/too-big-image')}
      />

      <Text style={[styles.section, { color: theme.text.default }]}>Device-relative</Text>
      <Button
        title="Too big on phone"
        description="Same image: warns on a phone, fine on an iPad"
        onPress={() => router.push('/examples/expo-image/too-big-phone')}
      />
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
  body: {
    fontSize: 15,
    marginBottom: 20,
  },
  section: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 8,
  },
});
