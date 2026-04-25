import type { GenerateMetadataFunction, Metadata } from 'expo-router/server';
import { Text } from 'react-native';

export const generateMetadata: GenerateMetadataFunction = async (request, params) => {
  const pathname = new URL(request.url).pathname;

  return {
    title: `Async Metadata ${params.id}`,
    description: `Async metadata for ${pathname}`,
  } satisfies Metadata;
};

export default function AsyncMetadataPage() {
  return <Text testID="async-metadata-text">Async Metadata</Text>;
}
