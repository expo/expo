import { useLoaderData, useLocalSearchParams, usePathname } from 'expo-router';
import { Suspense } from 'react';

import { Loading } from '../components/Loading';
import { Table, TableRow } from '../components/Table';
import { SiteLinks, SiteLink } from '../components/SiteLink';

export async function loader() {
  return Promise.resolve({
    data: 'root-index',
  });
}

export default function IndexRoute() {
  return (
    <Suspense fallback={<Loading />}>
      <IndexScreen />
    </Suspense>
  );
}

const IndexScreen = () => {
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
        <SiteLink href="/second">Go to Second</SiteLink>
        <SiteLink href="/env">Go to Env</SiteLink>
        <SiteLink href="/request">Go to Request</SiteLink>
        <SiteLink href="/response">Go to Response</SiteLink>
        <SiteLink href="/nested/">Go to Nested Index</SiteLink>
        <SiteLink href="/posts/static-post-1">Go to static Post 1</SiteLink>
        <SiteLink href="/posts/static-post-2">Go to static Post 2</SiteLink>
        <SiteLink href="/error">Go to Error</SiteLink>
      </SiteLinks>
    </>
  );
};


