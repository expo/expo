import { useLoaderData } from 'expo-router';
import { Suspense } from 'react';

import { LoaderData } from '@/components/LoaderData';
import { Loading } from '@/components/Loading';
import { Page } from '@/components/Page';
import { RouteDetails } from '@/components/RouteDetails';

export async function loader() {
  return Response.json({ data: 'blog' }, { headers: { 'Cache-Control': 'public, max-age=86400' } });
}

export default function BlogRoute() {
  return (
    <Page title="Blog" testID="headers-blog">
      <Suspense fallback={<Loading />}>
        <BlogScreen />
      </Suspense>
    </Page>
  );
}

function BlogScreen() {
  const data = useLoaderData<typeof loader>();
  return (
    <RouteDetails>
      <LoaderData value={data} />
    </RouteDetails>
  );
}
