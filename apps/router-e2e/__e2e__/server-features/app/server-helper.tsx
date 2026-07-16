import { useLoaderData } from 'expo-router';
import { createServerLoader } from 'expo-router/server';
import { Suspense } from 'react';

import { Loading } from '../components/Loading';
import { SiteLinks, SiteLink } from '../components/SiteLink';
import { Table, TableRow } from '../components/Table';

const _serverLoader = createServerLoader(async (request, _params) => {
  return {
    source: 'server-helper',
    url: request.url,
    method: request.method,
  };
});

// Only export the loader in SSR mode. In SSG mode, createServerLoader throws because there is no
// request object at build time.
export const loader = process.env.E2E_ROUTER_SERVER_RENDERING ? _serverLoader : undefined;

export default function ServerHelperRoute() {
  return (
    <Suspense fallback={<Loading />}>
      <ServerHelperScreen />
    </Suspense>
  );
}

const ServerHelperScreen = () => {
  const data = useLoaderData<typeof _serverLoader>();

  return (
    <>
      <Table>
        <TableRow label="Loader Data" value={data} testID="loader-result" />
      </Table>

      <SiteLinks>
        <SiteLink href="/">Go to Index</SiteLink>
        <SiteLink href="/static-helper">Go to Static Helper</SiteLink>
      </SiteLinks>
    </>
  );
};
