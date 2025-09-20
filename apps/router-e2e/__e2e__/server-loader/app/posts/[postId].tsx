import { useLoaderData, useLocalSearchParams, usePathname } from 'expo-router';
import { Container } from '../../components/Container';
import { Table, TableRow } from '../../components/Table';
import { SiteLinks, SiteLink } from '../../components/SiteLink';

export async function generateStaticParams(params: {
  id: 'one' | 'two';
}): Promise<Record<string, string>[]> {
  return [
    {
      postId: 'static-post-1',
    },
    {
      postId: 'static-post-2',
    },
  ];
}

export async function loader({ params }) {
  return Promise.resolve({
    params,
  });
}

export default function PostById() {
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
        <SiteLink href="/second">Go to Second</SiteLink>
      </SiteLinks>
    </Container>
  );
}
