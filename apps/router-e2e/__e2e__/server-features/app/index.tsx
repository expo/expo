import { useLoaderData, useLocalSearchParams, usePathname } from 'expo-router';
import { Suspense, useState } from 'react';
import { Button, Text } from 'react-native';

import { Loading } from '../components/Loading';
import { SiteLinks, SiteLink } from '../components/SiteLink';
import { Table, TableRow } from '../components/Table';

export async function loader() {
  return Promise.resolve({
    data: 'root-index',
  });
}

export default function IndexRoute() {
  return (
    <>
      {/* Outside the Suspense boundary: middleware and rendering tests identify this page by
          these testIDs in modes where loaders are disabled and the screen renders its fallback. */}
      <Text testID="title">Index</Text>
      <Text testID="index-text" style={{ fontFamily: 'sweet' }}>
        Index
      </Text>
      <Suspense fallback={<Loading />}>
        <IndexScreen />
      </Suspense>
    </>
  );
}

const IndexScreen = () => {
  const pathname = usePathname();
  const localParams = useLocalSearchParams();
  const data = useLoaderData<typeof loader>();
  const [count, setCount] = useState(0);

  return (
    <>
      <Table>
        <TableRow label="Pathname" value={pathname} testID="pathname-result" />
        <TableRow label="Local Params" value={localParams} testID="localparams-result" />
        <TableRow label="Loader Data" value={data} testID="loader-result" />
      </Table>

      <Table>
        <Button testID="index-increment" onPress={() => setCount((c) => c + 1)} title="increment" />
        <TableRow label="Count" value={count} testID="index-count" />
      </Table>

      <SiteLinks>
        <SiteLink href="/second">Go to Second</SiteLink>
        <SiteLink href="/env">Go to Env</SiteLink>
        <SiteLink href="/request">Go to Request</SiteLink>
        <SiteLink href="/response">Go to Response</SiteLink>
        <SiteLink href="/nested/">Go to Nested Index</SiteLink>
        <SiteLink href="/posts/static-post-1">Go to static Post 1</SiteLink>
        <SiteLink href="/posts/static-post-2">Go to static Post 2</SiteLink>
        <SiteLink href="/error">Go to Error</SiteLink>
        <SiteLink href="/(group)">Go to Grouped Index</SiteLink>
        <SiteLink href="/static-helper">Go to Static Helper</SiteLink>
        <SiteLink href="/server-helper">Go to Server Helper</SiteLink>
      </SiteLinks>
    </>
  );
};
