import { useLoaderData } from 'expo-router';
import { Suspense } from 'react';

import { LoaderData } from '@/components/LoaderData';
import { Loading } from '@/components/Loading';
import { Page } from '@/components/Page';
import { RouteDetails } from '@/components/RouteDetails';

export async function loader() {
  return Promise.resolve({
    data: 'nested-index',
  });
}

export default function NestedIndexRoute() {
  return (
    <Page title="Nested index" testID="loaders-nested-index">
      <Suspense fallback={<Loading />}>
        <NestedIndexScreen />
      </Suspense>
    </Page>
  );
}

function NestedIndexScreen() {
  const data = useLoaderData<typeof loader>();
  return (
    <RouteDetails>
      <LoaderData value={data} />
    </RouteDetails>
  );
}
