import { useLoaderData } from 'expo-router';
import { Suspense } from 'react';

import { LoaderData } from '@/components/LoaderData';
import { Loading } from '@/components/Loading';
import { Page } from '@/components/Page';
import { RouteDetails } from '@/components/RouteDetails';

export async function loader() {
  await new Promise((resolve) => setTimeout(resolve, 5000));
  return {
    data: 'slow',
    loadedAt: new Date().toISOString(),
  };
}

export default function SlowRoute() {
  return (
    <Page title="Slow" testID="loaders-slow">
      <Suspense fallback={<Loading />}>
        <SlowScreen />
      </Suspense>
    </Page>
  );
}

function SlowScreen() {
  const data = useLoaderData<typeof loader>();
  return (
    <RouteDetails>
      <LoaderData value={data} />
    </RouteDetails>
  );
}
