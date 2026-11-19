import { useLoaderData } from 'expo-router';
import { Suspense } from 'react';

import { Loading } from '../components/Loading';
import { SiteLinks, SiteLink } from '../components/SiteLink';
import { Table, TableRow } from '../components/Table';

export async function loader() {
  await new Promise((resolve) => setTimeout(resolve, 5000));
  return {
    data: 'slow',
    loadedAt: new Date().toISOString(),
  };
}

export default function SlowRoute() {
  return (
    <Suspense fallback={<SlowFallback />}>
      <SlowScreen />
    </Suspense>
  );
}

function SlowFallback() {
  return (
    <>
      <Loading />
      <SiteLinks>
        <SiteLink href="/second">Go to Second</SiteLink>
      </SiteLinks>
    </>
  );
}

function SlowScreen() {
  const data = useLoaderData<typeof loader>();

  return (
    <>
      <Table>
        <TableRow label="Loader Data" value={data} testID="loader-result" />
      </Table>

      <SiteLinks>
        <SiteLink href="/">Go to Index</SiteLink>
        <SiteLink href="/second">Go to Second</SiteLink>
      </SiteLinks>
    </>
  );
}
