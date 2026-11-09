import EvilIcons from '@expo/vector-icons/EvilIcons';
import { loadAsync } from 'expo-font';
import type { Metadata } from 'expo-router/server';
import { StyleSheet, Text } from 'react-native';

import { Page } from '@/components/Page';
import { colors } from '@/components/theme';
import { pageLabels } from '@/lib/lazy-labels';

// Read at module initialization to catch missing shared chunks.
const title = pageLabels[0];

export function generateMetadata(): Metadata {
  return { title: 'About | Website', description: 'About page' };
}

export default function AboutRoute() {
  // Ensure this font is loaded on this page only.
  loadAsync(EvilIcons.font);

  return (
    <Page title="About" testID="rendering-about">
      <Text testID="content" style={styles.text}>
        {title}
      </Text>
    </Page>
  );
}

const styles = StyleSheet.create({
  text: {
    color: colors.text,
  },
});
