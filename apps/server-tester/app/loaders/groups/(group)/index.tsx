import { useLoaderData } from 'expo-router';
import { Suspense } from 'react';

import { LoaderData } from '@/components/LoaderData';
import { Loading } from '@/components/Loading';
import { Page } from '@/components/Page';
import { RouteDetails } from '@/components/RouteDetails';

export async function loader() {
  return Promise.resolve({
    data: 'grouped-index',
  });
}

export default function GroupedIndexRoute() {
  return (
    <Page title="Grouped index" testID="loaders-grouped-index">
      <Suspense fallback={<Loading />}>
        <GroupedIndexScreen />
      </Suspense>
    </Page>
  );
}

function GroupedIndexScreen() {
  const data = useLoaderData<typeof loader>();
  return (
    <RouteDetails>
      <LoaderData value={data} />
    </RouteDetails>
  );
}
