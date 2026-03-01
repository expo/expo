import { useLoaderData, useLocalSearchParams, usePathname } from 'expo-router';
import { Suspense } from 'react';

import { Loading } from '../components/Loading';
import { SiteLinks, SiteLink } from '../components/SiteLink';
import { Table, TableRow } from '../components/Table';

export async function loader() {
  return Promise.resolve({
    TEST_SECRET_KEY: process.env.TEST_SECRET_KEY,
    TEST_SECRET_RUNTIME_KEY: process.env.TEST_SECRET_RUNTIME_KEY,
  });
}

export default function EnvRoute() {
  return (
    <Suspense fallback={<Loading />}>
      <EnvScreen />
    </Suspense>
  );
}

const EnvScreen = () => {
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
  )
}