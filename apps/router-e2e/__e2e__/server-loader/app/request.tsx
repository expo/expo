import { useLoaderData, useLocalSearchParams, usePathname } from 'expo-router';
import type { LoaderFunction } from 'expo-router/server';
import { Suspense } from 'react';

import { Loading } from '../components/Loading';
import { Table, TableRow } from '../components/Table';
import { SiteLinks, SiteLink } from '../components/SiteLink';

export const loader: LoaderFunction = (request, params) => {
  // In SSG, request is undefined since there's no HTTP request at build-time
  if (!request) {
    return { headers: null, url: null, method: null };
  }

  const url = new URL(request.url);

  if (url.searchParams.get('immutable') === 'true') {
    try {
      request.headers.set('X-Test', 'value');
      return { immutable: false, error: null }; // Should not reach here
    } catch (error) {
      return { immutable: true, error: (error as Error).message };
    }
  }

  let headers: { key: string; value: string }[] = [];
  request.headers.forEach((value, key) => {
    headers.push({ key, value });
  });
  return {
    headers: headers,
    url: request.url,
    method: request.method,
  };
};

export default function RequestRoute() {
  return (
    <Suspense fallback={<Loading />}>
      <RequestScreen />
    </Suspense>
  );
}

const RequestScreen = () => {
  const pathname = usePathname();
  const localParams = useLocalSearchParams();
  const data = useLoaderData<typeof loader>();

  return (
    <>
      <Table>
        <TableRow label="Pathname" value={pathname} testID="pathname-result" />
        <TableRow label="Local Params" value={localParams} testID="localparams-result" />
        <TableRow label="Loader Data" value={data} testID="loader-result" />
      </Table>

      <SiteLinks>
        <SiteLink href="/">Go to Index</SiteLink>
        <SiteLink href="/second">Go to Second</SiteLink>
      </SiteLinks>
    </>
  );
}
