import { useLoaderData, useLocalSearchParams, usePathname } from 'expo-router';
import { Suspense } from 'react';

import { Loading } from '../../components/Loading';
import { SiteLinks, SiteLink } from '../../components/SiteLink';
import { Table, TableRow } from '../../components/Table';

export async function loader() {
  return Promise.resolve({
    data: 'nested-index',
  });
}

export default function NestedIndexRoute() {
  return (
    <Suspense fallback={<Loading />}>
      <NestedIndexScreen />
    </Suspense>
  );
}

const NestedIndexScreen = () => {
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
};
