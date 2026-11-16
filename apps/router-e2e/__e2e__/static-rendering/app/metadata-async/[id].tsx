import type { GenerateMetadataFunction, Metadata } from 'expo-router/server';
import { Text } from 'react-native';

export function generateStaticParams() {
  return [{ id: '123' }];
}

export const generateMetadata: GenerateMetadataFunction = async (request, params) => {
  const pathname = request ? new URL(request.url).pathname : `/metadata-async/${params.id}`;

  return {
    title: `Async Metadata ${params.id}`,
    description: `Async metadata for ${pathname}`,
  } satisfies Metadata;
};

export default function AsyncMetadataPage() {
  return <Text testID="async-metadata-text">Async Metadata</Text>;
}
