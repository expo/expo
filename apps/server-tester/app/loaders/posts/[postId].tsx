import { useLoaderData } from 'expo-router';
import { ImmutableRequest } from 'expo-router/server';
import { Suspense } from 'react';

import { LoaderData } from '@/components/LoaderData';
import { Loading } from '@/components/Loading';
import { Page } from '@/components/Page';
import { RouteDetails } from '@/components/RouteDetails';

export async function generateStaticParams(): Promise<Record<string, string>[]> {
  return [
    {
      postId: 'static-post-1',
    },
    {
      postId: 'static-post-2',
    },
  ];
}

export async function loader(
  _: ImmutableRequest | undefined,
  params: Record<string, string | string[]>
) {
  return Promise.resolve({
    params,
  });
}

export default function PostByIdRoute() {
  return (
    <Page title="Post" testID="loaders-post">
      <Suspense fallback={<Loading />}>
        <PostByIdScreen />
      </Suspense>
    </Page>
  );
}

function PostByIdScreen() {
  const data = useLoaderData<typeof loader>();
  return (
    <RouteDetails>
      <LoaderData value={data} />
    </RouteDetails>
  );
}
