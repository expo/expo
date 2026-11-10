import { useLoaderData } from 'expo-router';
import { Suspense } from 'react';

import { LoaderData } from '@/components/LoaderData';
import { Loading } from '@/components/Loading';
import { Page } from '@/components/Page';
import { RouteDetails } from '@/components/RouteDetails';

export async function loader() {
  return Promise.resolve({
    TEST_SECRET_KEY: process.env.TEST_SECRET_KEY,
    TEST_SECRET_RUNTIME_KEY: process.env.TEST_SECRET_RUNTIME_KEY,
  });
}

export default function EnvRoute() {
  return (
    <Page title="Env" testID="loaders-env">
      <Suspense fallback={<Loading />}>
        <EnvScreen />
      </Suspense>
    </Page>
  );
}

function EnvScreen() {
  const data = useLoaderData<typeof loader>();
  return (
    <RouteDetails>
      <LoaderData value={data} />
    </RouteDetails>
  );
}
