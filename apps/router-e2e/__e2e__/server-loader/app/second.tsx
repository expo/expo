import { useLoaderData, useLocalSearchParams, usePathname } from 'expo-router';
import { Container } from '../components/Container';
import { Table, TableRow } from '../components/Table';
import { SiteLinks, SiteLink } from '../components/SiteLink';

export async function loader({ params }) {
  return Promise.resolve({
    data: 'second'
  });
}

export default function Second() {
  const pathname = usePathname();
  const localParams = useLocalSearchParams();
  const data = useLoaderData(loader);

  return (
    <Container>
      <Table>
        <TableRow label="Pathname" value={pathname} testID="pathname-result" />
        <TableRow label="Local Params" value={localParams} testID="localparams-result" />
        <TableRow label="Loader Data" value={data} testID="loader-result" />
      </Table>

      <SiteLinks>
        <SiteLink href="/">Go to Index</SiteLink>
        <SiteLink href="/env">Go to Env</SiteLink>
        <SiteLink href="/posts/static-post-1">Go to static Post 1</SiteLink>
        <SiteLink href="/posts/static-post-2">Go to static Post 2</SiteLink>
      </SiteLinks>
    </Container>
  );
}
