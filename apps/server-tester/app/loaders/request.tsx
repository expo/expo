import { useLoaderData } from 'expo-router';
import type { LoaderFunction } from 'expo-router/server';
import { Suspense } from 'react';

import { LoaderData } from '@/components/LoaderData';
import { Loading } from '@/components/Loading';
import { Page } from '@/components/Page';
import { RouteDetails } from '@/components/RouteDetails';

export const loader: LoaderFunction = (request, params) => {
  // In SSG there is no HTTP request at build time.
  if (!request) {
    return { headers: null, url: null, method: null };
  }

  const url = new URL(request.url);

  if (url.searchParams.get('immutable') === 'true') {
    try {
      // @ts-ignore The next line fails at runtime on purpose.
      request.headers.set('X-Test', 'value');
      return { immutable: false, error: null };
    } catch (error) {
      return { immutable: true, error: (error as Error).message };
    }
  }

  const headers: { key: string; value: string }[] = [];
  request.headers.forEach((value, key) => {
    headers.push({ key, value });
  });
  return {
    headers,
    url: request.url,
    method: request.method,
  };
};

export default function RequestRoute() {
  return (
    <Page title="Request" testID="loaders-request">
      <Suspense fallback={<Loading />}>
        <RequestScreen />
      </Suspense>
    </Page>
  );
}

function RequestScreen() {
  const data = useLoaderData<typeof loader>();
  return (
    <RouteDetails>
      <LoaderData value={data} />
    </RouteDetails>
  );
}
