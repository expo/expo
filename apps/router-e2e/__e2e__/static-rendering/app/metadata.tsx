import type { GenerateMetadataFunction } from 'expo-server';
import Head from 'expo-router/head';
import { Text } from 'react-native';

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
  };
};

export default function MetadataPage() {
  return (
    <>
      <Head>
        <meta name="expo-e2e-metadata-head" content="head" />
      </Head>
      <Text testID="metadata-text">Metadata</Text>
    </>
  );
}
