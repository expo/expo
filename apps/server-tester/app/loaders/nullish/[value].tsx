import { useLoaderData } from 'expo-router';
import { ImmutableRequest } from 'expo-router/server';
import { Suspense } from 'react';

import { Json } from '@/components/Json';
import { LoaderData } from '@/components/LoaderData';
import { Loading } from '@/components/Loading';
import { Page } from '@/components/Page';
import { Panel } from '@/components/Panel';
import { RouteDetails } from '@/components/RouteDetails';
import { Section } from '@/components/Section';

export async function generateStaticParams(): Promise<Record<string, string>[]> {
  return [{ value: 'null' }, { value: 'undefined' }];
}

export async function loader(
  _: ImmutableRequest | undefined,
  params: Record<string, string | string[]>
) {
  if (params.value === 'null') {
    return null;
  }
  if (params.value === 'undefined') {
    return undefined;
  }
  return { value: params.value };
}

export default function NullishRoute() {
  return (
    <Page title="Nullish loader data" testID="loaders-nullish">
      <Suspense fallback={<Loading />}>
        <NullishScreen />
      </Suspense>
    </Page>
  );
}

function NullishScreen() {
  const data = useLoaderData<typeof loader>();
  // `Json` renders nothing for `null`, so the page shows a marker string that tests can parse.
  const displayData = data === null ? 'NULL' : data;
  const displayType = data === null ? 'null' : typeof data;
  return (
    <RouteDetails>
      <LoaderData value={displayData} />
      <Section title="Loader type">
        <Panel>
          <Json value={displayType} testID="loader-type-result" />
        </Panel>
      </Section>
    </RouteDetails>
  );
}
