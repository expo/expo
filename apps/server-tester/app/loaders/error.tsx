import { ErrorBoundaryProps, useLoaderData } from 'expo-router';
import { Suspense } from 'react';

import { Json } from '@/components/Json';
import { Loading } from '@/components/Loading';
import { Page } from '@/components/Page';
import { Panel } from '@/components/Panel';
import { Section } from '@/components/Section';

export async function loader() {
  if (process.env.TEST_THROW_ERROR === 'true') {
    throw new Error('Intentional loader error for testing');
  }
}

export function ErrorBoundary({ error }: ErrorBoundaryProps) {
  return (
    <Page title="Loader error" testID="loaders-error-boundary">
      <Section title="Error">
        <Panel>
          <Json value={error.message} testID="error-message" />
        </Panel>
      </Section>
    </Page>
  );
}

export default function ErrorRoute() {
  return (
    <Page title="Loader error" testID="loaders-error">
      <Suspense fallback={<Loading />}>
        <ErrorScreen />
      </Suspense>
    </Page>
  );
}

function ErrorScreen() {
  const data = useLoaderData<typeof loader>();
  return (
    <Section title="This should not render">
      <Panel>
        <Json value={data} testID="should-not-render" />
      </Panel>
    </Section>
  );
}
