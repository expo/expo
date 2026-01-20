import { useLoaderData, useLocalSearchParams, usePathname } from 'expo-router';
import { Container } from '../../components/Container';
import { Table, TableRow } from '../../components/Table';
import { SiteLinks, SiteLink } from '../../components/SiteLink';

export async function generateStaticParams(): Promise<Record<string, string>[]> {
  return [{ value: 'null' }, { value: 'undefined' }];
}

export async function loader(_: Request, params: { value: string }) {
  if (params.value === 'null') {
    return null;
  }
  if (params.value === 'undefined') {
    return undefined;
  }
  return { value: params.value };
}

export default function Nullish() {
  const pathname = usePathname();
  const { value } = useLocalSearchParams<{ value: string }>();
  const data = useLoaderData<typeof loader>();

  const displayData = data === null ? 'NULL' : data === undefined ? 'UNDEFINED' : data;
  const displayType = data === null ? 'null' : typeof data;

  return (
    <Container>
      <Table>
        <TableRow label="Pathname" value={pathname} testID="pathname-result" />
        <TableRow label="Param Value" value={value} testID="param-result" />
        <TableRow label="Loader Data" value={displayData} testID="loader-result" />
        <TableRow label="Loader Type" value={displayType} testID="loader-type-result" />
      </Table>
      <SiteLinks>
        <SiteLink href="/">Go to Index</SiteLink>
        <SiteLink href="/nullish/null">Test Null</SiteLink>
        <SiteLink href="/nullish/undefined">Test Undefined</SiteLink>
      </SiteLinks>
    </Container>
  );
}
