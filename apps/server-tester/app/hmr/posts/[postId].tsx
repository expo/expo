import { useLoaderData } from 'expo-router';
import { ImmutableRequest } from 'expo-router/server';
import { Suspense } from 'react';

import { LoaderData } from '@/components/LoaderData';
import { Loading } from '@/components/Loading';
import { Page } from '@/components/Page';
import { RouteDetails } from '@/components/RouteDetails';

export async function generateStaticParams(): Promise<Record<string, string>[]> {
  return [{ postId: 'hmr-post-1' }];
}

export async function loader(
  _: ImmutableRequest | undefined,
  params: Record<string, string | string[]>
) {
  return Promise.resolve({
    params,
  });
}

export default function HmrPostByIdRoute() {
  return (
    <Page title="HMR post" testID="hmr-post">
      <Suspense fallback={<Loading />}>
        <HmrPostByIdScreen />
      </Suspense>
    </Page>
  );
}

function HmrPostByIdScreen() {
  const data = useLoaderData<typeof loader>();
  return (
    <RouteDetails>
      <LoaderData value={data} />
    </RouteDetails>
  );
}
