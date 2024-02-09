// Test the nested <Head> component is rendered during SSR.
import Head from 'expo-router/head';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import { loadAsync } from 'expo-font';
import React from 'react';
import { Text } from 'react-native';

export default function Page() {
  // Ensure this font is loaded on this page only.
  loadAsync(EvilIcons.font);

  return (
    <>
      <Head>
        <title>About | Website</title>
        <meta name="description" content="About page" />
      </Head>
      <Text testID="content">About</Text>
    </>
  );
}
