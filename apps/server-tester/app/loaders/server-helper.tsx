import { useLoaderData } from 'expo-router';
import { createServerLoader } from 'expo-router/server';
import { Suspense } from 'react';

import { LoaderData } from '@/components/LoaderData';
import { Loading } from '@/components/Loading';
import { Page } from '@/components/Page';
import { RouteDetails } from '@/components/RouteDetails';

const serverLoader = createServerLoader(async (request, _params) => {
  return {
    source: 'server-helper',
    url: request.url,
    method: request.method,
  };
});

// Only export the loader in SSR mode. In SSG mode, createServerLoader() throws because there is
// no request object at build time.
export const loader = process.env.E2E_ROUTER_WEB_OUTPUT === 'server' ? serverLoader : undefined;

export default function ServerHelperRoute() {
  return (
    <Page title="createServerLoader()" testID="loaders-server-helper">
      {process.env.E2E_ROUTER_WEB_OUTPUT === 'server' ? (
        <Suspense fallback={<Loading />}>
          <ServerHelperScreen />
        </Suspense>
      ) : (
        <RouteDetails />
      )}
    </Page>
  );
}

function ServerHelperScreen() {
  const data = useLoaderData<typeof serverLoader>();
  return (
    <RouteDetails>
      <LoaderData value={data} />
    </RouteDetails>
  );
}
