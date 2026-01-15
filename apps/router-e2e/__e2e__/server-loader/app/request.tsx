import { type LoaderFunction, useLoaderData, useLocalSearchParams, usePathname } from 'expo-router';
import { Container } from '../components/Container';
import { Table, TableRow } from '../components/Table';
import { SiteLinks, SiteLink } from '../components/SiteLink';

export const loader: LoaderFunction = ({ request }) => {
  // In SSG, request is unavailable since there's no HTTP request at build time
  if (!request) {
    return { headers: null, url: null, method: null };
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
}

export default function RequestRoute() {
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
