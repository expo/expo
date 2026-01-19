import { useLoaderData, usePathname } from 'expo-router';
import { Container } from '../components/Container';
import { Table, TableRow } from '../components/Table';
import { SiteLinks, SiteLink } from '../components/SiteLink';

export async function loader() {
  return Response.json({ foo: 'bar' }, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'X-Custom-Header': 'test-value',
    },
  });
}

export default function ResponseRoute() {
  const pathname = usePathname();
  const data = useLoaderData<typeof loader>();

  return (
    <Container>
      <Table>
        <TableRow label="Pathname" value={pathname} testID="pathname-result" />
        <TableRow label="Loader Data" value={data} testID="loader-result" />
      </Table>

      <SiteLinks>
        <SiteLink href="/">Go to Index</SiteLink>
        <SiteLink href="/second">Go to Second</SiteLink>
      </SiteLinks>
    </Container>
  );
}