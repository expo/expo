import { useLoaderData, useLocalSearchParams, usePathname } from 'expo-router';
import { ImmutableRequest } from 'expo-router/server';
import { Suspense } from 'react';

import { Loading } from '../../components/Loading';;
import { SiteLinks, SiteLink } from '../../components/SiteLink';
import { Table, TableRow } from '../../components/Table';

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

export async function loader(_: ImmutableRequest, params: Record<string, string | string[]>) {
  return Promise.resolve({
    params,
  });
}

export default function PostByIdRoute() {
  return (
    <Suspense fallback={<Loading />}>
      <PostByIdScreen />
    </Suspense>
  );
}

const PostByIdScreen = () => {
  const pathname = usePathname();
  const localParams = useLocalSearchParams();
  const data = useLoaderData<typeof loader>();

  return (
    <>
      <Table>
        <TableRow label="Pathname" value={pathname} testID="pathname-result" />
        <TableRow label="Local Params" value={localParams} testID="localparams-result" />
        <TableRow label="Loader Data" value={data} testID="loader-result" />
      </Table>

      <SiteLinks>
        <SiteLink href="/">Go to Index</SiteLink>
        <SiteLink href="/second">Go to Second</SiteLink>
      </SiteLinks>
    </>
  );
}