import { useLoaderData, useLocalSearchParams, usePathname } from 'expo-router';
import Head from 'expo-router/head';
import { Container } from '../components/Container';
import { Table, TableRow } from '../components/Table';
import { SiteLinks, SiteLink } from '../components/SiteLink';

export async function loader() {
  return {
    title: 'Meta page',
    description: 'Meta tag testing',
    keywords: 'expo-router,loaders,meta',
    author: 'Expo'
  };
}

export default function MetaRoute() {
  const pathname = usePathname();
  const localParams = useLocalSearchParams();
  const data = useLoaderData<typeof loader>();

  return (
    <Container>
      <Head>
        <title>{data.title}</title>
        <meta name="description" content={data.description} />
        <meta name="keywords" content={data.keywords} />
        <meta name="author" content={data.author} />
      </Head>

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
