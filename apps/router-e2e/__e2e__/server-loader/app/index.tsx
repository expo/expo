import { useLocalSearchParams, usePathname } from 'expo-router';
import { Container } from '../components/Container';
import { Table, TableRow } from '../components/Table';
import { SiteLinks, SiteLink } from '../components/SiteLink';

export default function Index() {
  const pathname = usePathname();
  const localParams = useLocalSearchParams();

  return (
    <Container>
      <Table>
        <TableRow label="Pathname" value={pathname} testID="pathname-result" />
        <TableRow label="Local Params" value={localParams} testID="localparams-result" />
      </Table>

      <SiteLinks>
        <SiteLink href="/second">Go to Second</SiteLink>
        <SiteLink href="/env">Go to Env</SiteLink>
        <SiteLink href="/posts/static-post-1">Go to static Post 1</SiteLink>
        <SiteLink href="/posts/static-post-2">Go to static Post 2</SiteLink>
      </SiteLinks>
    </Container>
  );
}


