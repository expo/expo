import { useLoaderData } from 'expo-router';
import { type LoaderFunction } from 'expo-router/server';
import { setResponseHeaders } from 'expo-server';
import { Suspense } from 'react';

import { LoaderData } from '@/components/LoaderData';
import { Loading } from '@/components/Loading';
import { Page } from '@/components/Page';
import { RouteDetails } from '@/components/RouteDetails';

export const loader: LoaderFunction = (request) => {
  // In SSG there is no HTTP request at build time.
  if (!request) {
    return Response.json(
      { foo: null },
      {
        headers: {
          'Cache-Control': 'public, max-age=604800',
          // Not on the SSG header allowlist, so it never reaches clients.
          'X-Loader-Header': 'loader-value',
        },
      }
    );
  }

  const url = new URL(request.url);

  if (url.searchParams.get('setresponseheaders') === 'true') {
    setResponseHeaders({
      'Cache-Control': 'public, max-age=3600',
      'X-Custom-Header': 'set-via-setResponseHeaders',
    });
    return { foo: 'bar' };
  }

  return Response.json(
    { foo: 'bar' },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600',
        'X-Custom-Header': 'set-via-response',
      },
    }
  );
};

export default function ResponseRoute() {
  return (
    <Page title="Response" testID="loaders-response">
      <Suspense fallback={<Loading />}>
        <ResponseScreen />
      </Suspense>
    </Page>
  );
}

function ResponseScreen() {
  const data = useLoaderData<typeof loader>();
  return (
    <RouteDetails>
      <LoaderData value={data} />
    </RouteDetails>
  );
}
