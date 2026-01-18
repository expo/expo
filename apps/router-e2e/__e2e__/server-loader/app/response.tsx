import { type LoaderFunction, useLoaderData, useLocalSearchParams, usePathname } from 'expo-router';
import { setResponseHeaders } from 'expo-server';

import { Container } from '../components/Container';
import { SiteLinks, SiteLink } from '../components/SiteLink';
import { Table, TableRow } from '../components/Table';

export const loader: LoaderFunction = ({ request }) => {
  // In SSG, request is unavailable since there's no HTTP request at build time
  if (!request) {
    return { foo: null };
  }

  const url = new URL(request!.url);

  if (url.searchParams.get('setresponseheaders') === 'true') {
    setResponseHeaders({
      'Cache-Control': 'public, max-age=3600',
      'X-Custom-Header': 'set-via-setResponseHeaders',
    });
    return { foo: 'bar' };
  }

  return Response.json(
    { foo: 'bar' },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600',
        'X-Custom-Header': 'set-via-response',
      },
    }
  );
};

export default function ResponseRoute() {
  const pathname = usePathname();
  const localParams = useLocalSearchParams();
  const data = useLoaderData<typeof loader>();

  return (
    <Container>
      <Table>
        <TableRow label="Pathname" value={pathname} testID="pathname-result" />
        <TableRow label="Local Params" value={localParams} testID="localparams-result" />
        <TableRow label="Loader Data" value={data} testID="loader-result" />
      </Table>

      <SiteLinks>
        <SiteLink href="/">Go to Index</SiteLink>
        <SiteLink href="/second">Go to Second</SiteLink>
      </SiteLinks>
    </Container>
  );
}
