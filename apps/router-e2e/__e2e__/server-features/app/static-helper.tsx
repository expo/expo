import { useLoaderData } from 'expo-router';
import { createStaticLoader } from 'expo-router/server';
import { Suspense } from 'react';

import { Loading } from '../components/Loading';
import { SiteLinks, SiteLink } from '../components/SiteLink';
import { Table, TableRow } from '../components/Table';

export const loader = createStaticLoader(async (_params) => {
  return { source: 'static-helper' };
});

export default function StaticHelperRoute() {
  return (
    <Suspense fallback={<Loading />}>
      <StaticHelperScreen />
    </Suspense>
  );
}

const StaticHelperScreen = () => {
  const data = useLoaderData<typeof loader>();

  return (
    <>
      <Table>
        <TableRow label="Loader Data" value={data} testID="loader-result" />
      </Table>

      <SiteLinks>
        <SiteLink href="/">Go to Index</SiteLink>
        <SiteLink href="/server-helper">Go to Server Helper</SiteLink>
      </SiteLinks>
    </>
  );
};
