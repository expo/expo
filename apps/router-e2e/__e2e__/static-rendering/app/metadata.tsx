import Head from 'expo-router/head';
import { Text } from 'react-native';
import type { GenerateMetadataFunction, Metadata } from 'expo-router/server';

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

export default function MetadataPage() {
  return (
    <>
      {/* The <Head> component is here to check that the app doesn't crash when using it with `generateMetadata()` */}
      <Head>
        <meta name="expo-e2e-metadata-head" content="head" />
      </Head>
      <Text testID="metadata-text">Metadata</Text>
    </>
  );
}
