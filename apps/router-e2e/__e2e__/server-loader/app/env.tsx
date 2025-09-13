import { useLoaderData, useLocalSearchParams, usePathname, useSegments } from 'expo-router';
import { Container } from '../components/Container';
import { Table, TableRow } from '../components/Table';
import { SiteLinks, SiteLink } from '../components/SiteLink';

export async function loader() {
  return Promise.resolve({
    ...process.env,
  });
}

export default function Env() {
  const pathname = usePathname();
  const localParams = useLocalSearchParams();
  const segments = useSegments();
  const data = useLoaderData(loader);

  return (
    <Container>
      <Table>
        <TableRow label="Pathname" value={pathname} testID="pathname-result" />
        <TableRow label="Local Params" value={localParams} testID="localparams-result" />
        <TableRow label="Segments" value={segments} testID="segments-result" />
        <TableRow label="Loader Data" value={data} testID="loader-result" />
      </Table>

      <SiteLinks>
        <SiteLink href="/">Go to Index</SiteLink>
        <SiteLink href="/second">Go to Second</SiteLink>
      </SiteLinks>
    </Container>
  );
}
