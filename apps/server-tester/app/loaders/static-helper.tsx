import { useLoaderData } from 'expo-router';
import { createStaticLoader } from 'expo-router/server';
import { Suspense } from 'react';

import { LoaderData } from '@/components/LoaderData';
import { Loading } from '@/components/Loading';
import { Page } from '@/components/Page';
import { RouteDetails } from '@/components/RouteDetails';

export const loader = createStaticLoader(async (_params) => {
  return { source: 'static-helper' };
});

export default function StaticHelperRoute() {
  return (
    <Page title="createStaticLoader()" testID="loaders-static-helper">
      <Suspense fallback={<Loading />}>
        <StaticHelperScreen />
      </Suspense>
    </Page>
  );
}

function StaticHelperScreen() {
  const data = useLoaderData<typeof loader>();
  return (
    <RouteDetails>
      <LoaderData value={data} />
    </RouteDetails>
  );
}
