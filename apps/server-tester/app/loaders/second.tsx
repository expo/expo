import { useLoaderData } from 'expo-router';
import { Suspense } from 'react';

import { LoaderData } from '@/components/LoaderData';
import { Loading } from '@/components/Loading';
import { Page } from '@/components/Page';
import { RouteDetails } from '@/components/RouteDetails';

export function loader() {
  return Response.json({ data: 'second' }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export default function SecondRoute() {
  return (
    <Page title="Second" testID="loaders-second">
      <Suspense fallback={<Loading />}>
        <SecondScreen />
      </Suspense>
    </Page>
  );
}

function SecondScreen() {
  const data = useLoaderData<typeof loader>();
  return (
    <RouteDetails>
      <LoaderData value={data} />
    </RouteDetails>
  );
}
