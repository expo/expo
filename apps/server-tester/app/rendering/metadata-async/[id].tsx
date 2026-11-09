import type { GenerateMetadataFunction, Metadata } from 'expo-router/server';
import { StyleSheet, Text } from 'react-native';

import { Page } from '@/components/Page';
import { colors } from '@/components/theme';

export function generateStaticParams() {
  return [{ id: '123' }];
}

export const generateMetadata: GenerateMetadataFunction = async (request, params) => {
  const pathname = request
    ? new URL(request.url).pathname
    : `/rendering/metadata-async/${params.id}`;

  return {
    title: `Async Metadata ${params.id}`,
    description: `Async metadata for ${pathname}`,
  } satisfies Metadata;
};

export default function AsyncMetadataRoute() {
  return (
    <Page title="Async metadata" testID="rendering-metadata-async">
      <Text testID="async-metadata-text" style={styles.text}>
        Async Metadata
      </Text>
    </Page>
  );
}

const styles = StyleSheet.create({
  text: {
    color: colors.text,
  },
});
