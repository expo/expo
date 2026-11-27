import Head from 'expo-router/head';
import type { GenerateMetadataFunction, Metadata } from 'expo-router/server';
import { StyleSheet, Text } from 'react-native';

import { Page } from '@/components/Page';
import { colors } from '@/components/theme';

export const generateMetadata: GenerateMetadataFunction = async () => {
  return {
    title: 'Metadata Page',
    description: 'Page with generateMetadata',
    keywords: ['metadata', 'e2e'],
    openGraph: {
      title: 'Metadata OG Title',
      description: 'Metadata OG Description',
    },
    twitter: {
      card: 'summary',
      title: 'Metadata Twitter Title',
    },
  } satisfies Metadata;
};

export default function MetadataRoute() {
  return (
    <Page title="Metadata" testID="rendering-metadata">
      {/* The <Head> component is here to check that the app doesn't crash when using it with `generateMetadata()` */}
      <Head>
        <meta name="expo-e2e-metadata-head" content="head" />
      </Head>
      <Text testID="metadata-text" style={styles.text}>
        Metadata
      </Text>
    </Page>
  );
}

const styles = StyleSheet.create({
  text: {
    color: colors.text,
  },
});
