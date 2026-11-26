import type { Metadata } from 'expo-router/server';

import { Json } from '@/components/Json';
import { Page } from '@/components/Page';
import { Panel } from '@/components/Panel';
import { Section } from '@/components/Section';

export function generateMetadata(): Metadata {
  return {
    other: {
      'expo-e2e-public-env-var-client': process.env.EXPO_PUBLIC_TEST_VALUE,
      'expo-e2e-private-env-var-client': process.env.EXPO_NOT_PUBLIC_TEST_VALUE,
    },
  };
}

export default function EnvMetadataRoute() {
  return (
    <Page title="Environment metadata" testID="rendering-env-metadata">
      <Section title="EXPO_PUBLIC_TEST_VALUE">
        <Panel>
          <Json value={process.env.EXPO_PUBLIC_TEST_VALUE} testID="env-metadata-public" />
        </Panel>
      </Section>
    </Page>
  );
}
