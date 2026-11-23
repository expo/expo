import { useLoaderData } from 'expo-router';
import { json } from 'expo-server';
import { Suspense } from 'react';

import { LoaderData } from '@/components/LoaderData';
import { Loading } from '@/components/Loading';
import { Page } from '@/components/Page';
import { RouteDetails } from '@/components/RouteDetails';

export function loader() {
  return json(
    { source: 'json-helper', count: 1 },
    {
      headers: {
        'Cache-Control': 'public, max-age=60',
        'X-Loader-Header': 'json-helper',
      },
    }
  );
}

export default function JsonHelperRoute() {
  return (
    <Page title="json()" testID="loaders-json-helper">
      <Suspense fallback={<Loading />}>
        <JsonHelperScreen />
      </Suspense>
    </Page>
  );
}

function JsonHelperScreen() {
  const { source, count } = useLoaderData<typeof loader>();
  return (
    <RouteDetails>
      <LoaderData value={{ source, count }} />
    </RouteDetails>
  );
}
