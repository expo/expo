import EvilIcons from '@expo/vector-icons/EvilIcons';
import { loadAsync } from 'expo-font';
import type { Metadata } from 'expo-router/server';
import { Text } from 'react-native';

import { pageLabels } from '../lazy-labels';

// Read at module initialization to catch missing shared chunks.
const title = pageLabels[0];

export function generateMetadata(): Metadata {
  return { title: 'About | Website', description: 'About page' };
}

export default function Page() {
  // Ensure this font is loaded on this page only.
  loadAsync(EvilIcons.font);

  return <Text testID="content">{title}</Text>;
}
