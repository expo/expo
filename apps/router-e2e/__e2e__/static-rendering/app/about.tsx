import EvilIcons from '@expo/vector-icons/EvilIcons';
import { loadAsync } from 'expo-font';
// Test the nested <Head> component is rendered during SSR.
import Head from 'expo-router/head';
import React from 'react';
import { Text } from 'react-native';

import { pageLabels } from '../lazy-labels';

// Read at module initialization to catch missing shared chunks.
const title = pageLabels[0];

export default function Page() {
  // Ensure this font is loaded on this page only.
  loadAsync(EvilIcons.font);

  return (
    <>
      <Head>
        <title>About | Website</title>
        <meta name="description" content="About page" />
      </Head>
      <Text testID="content">{title}</Text>
    </>
  );
}
