import { useLoaderData, useLocalSearchParams, usePathname } from 'expo-router';
import { Suspense } from 'react';

import { Loading } from '../../../components/Loading';
import { SiteLinks, SiteLink } from '../../../components/SiteLink';
import { Table, TableRow } from '../../../components/Table';

export async function generateStaticParams(): Promise<Record<string, string>[]> {
  return [{ slug: 'alpha/beta' }];
}

export async function loader() {
  return Promise.resolve({ data: 'platform-catch-all' });
}

export default function PlatformCatchAllRoute() {
  return (
    <Suspense fallback={<Loading />}>
      <PlatformCatchAllScreen />
    </Suspense>
  );
}

function PlatformCatchAllScreen() {
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
      </SiteLinks>
    </>
  );
}
