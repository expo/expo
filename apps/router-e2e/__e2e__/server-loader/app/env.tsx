import { useLoaderData, useLocalSearchParams, usePathname } from 'expo-router';
import { Container } from '../components/Container';
import { Table, TableRow } from '../components/Table';
import { SiteLinks, SiteLink } from '../components/SiteLink';
import { Suspense } from 'react';

export async function loader() {
  return Promise.resolve({
    ...process.env,
  });
}

const Loaded = () => {
  const data = useLoaderData<typeof loader>();
  return (
    <TableRow label="Loader Data" value={data} testID="loader-result" />
  )
}

const Render = ({
  pathname,
  localParams,
}) => {
  return (
    <Container>
      <Table>
        <TableRow label="Pathname" value={pathname} testID="pathname-result" />
        <TableRow label="Local Params" value={localParams} testID="localparams-result" />
        <Suspense>
          <Loaded />
          {/*<TableRow label="Loader Data" value={data} testID="loader-result" />*/}
        </Suspense>
      </Table>

      <SiteLinks>
        <SiteLink href="/">Go to Index</SiteLink>
        <SiteLink href="/second">Go to Second</SiteLink>
      </SiteLinks>
    </Container>
  )
}

export default function Env() {
  const pathname = usePathname();
  const localParams = useLocalSearchParams();
  // const data = useLoaderData<typeof loader>();

  return <Render localParams={localParams} pathname={pathname} />;
  // return (
  //   <Container>
  //     <Table>
  //       <TableRow label="Pathname" value={pathname} testID="pathname-result" />
  //       <TableRow label="Local Params" value={localParams} testID="localparams-result" />
  //       <TableRow label="Loader Data" value={data} testID="loader-result" />
  //     </Table>
  //
  //     <SiteLinks>
  //       <SiteLink href="/">Go to Index</SiteLink>
  //       <SiteLink href="/second">Go to Second</SiteLink>
  //     </SiteLinks>
  //   </Container>
  // );
}
