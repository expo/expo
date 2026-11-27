import { useLoaderData } from 'expo-router';
import { Suspense } from 'react';

import { LoaderData } from '@/components/LoaderData';
import { Loading } from '@/components/Loading';
import { Page } from '@/components/Page';
import { RouteDetails } from '@/components/RouteDetails';

export async function generateStaticParams(): Promise<Record<string, string>[]> {
  return [{ slug: 'alpha/beta' }];
}

export async function loader() {
  return Promise.resolve({ data: 'platform-catch-all' });
}

export default function PlatformCatchAllRoute() {
  return (
    <Page title="Platform catch-all" testID="loaders-platform-catch-all">
      <Suspense fallback={<Loading />}>
        <PlatformCatchAllScreen />
      </Suspense>
    </Page>
  );
}

function PlatformCatchAllScreen() {
  const data = useLoaderData<typeof loader>();
  return (
    <RouteDetails>
      <LoaderData value={data} />
    </RouteDetails>
  );
}
