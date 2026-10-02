import { useLoaderData, useLocalSearchParams, usePathname } from 'expo-router';
import { ImmutableRequest } from 'expo-router/server';
import { Suspense } from 'react';

import { Loading } from '../../../../components/Loading';
import { SiteLinks, SiteLink } from '../../../../components/SiteLink';
import { Table, TableRow } from '../../../../components/Table';

export async function generateStaticParams(): Promise<Record<string, string>[]> {
  return [{ eventId: 'event-1' }];
}

export async function loader(_: ImmutableRequest, params: Record<string, string | string[]>) {
  return Promise.resolve({ data: 'platform-index-sibling', params });
}

export default function PlatformIndexSiblingRoute() {
  return (
    <Suspense fallback={<Loading />}>
      <PlatformIndexSiblingScreen />
    </Suspense>
  );
}

function PlatformIndexSiblingScreen() {
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
