import { useLoaderData } from 'expo-router';
import { Suspense, useState } from 'react';
import { Button } from 'react-native';

import { Json } from '@/components/Json';
import { LoaderData } from '@/components/LoaderData';
import { Loading } from '@/components/Loading';
import { Page } from '@/components/Page';
import { Panel } from '@/components/Panel';
import { RouteDetails } from '@/components/RouteDetails';
import { RouteLink, RouteLinks } from '@/components/RouteLinks';
import { Section } from '@/components/Section';

export async function loader() {
  return Promise.resolve({
    data: 'root-index',
  });
}

export default function LoadersIndexRoute() {
  return (
    <Page title="Loaders" testID="loaders-index">
      <Suspense fallback={<Loading />}>
        <LoadersIndexScreen />
      </Suspense>
      <Section title="Posts">
        <RouteLinks>
          <RouteLink href="/loaders/posts/static-post-1" />
          <RouteLink href="/loaders/posts/static-post-2" />
        </RouteLinks>
      </Section>
    </Page>
  );
}

function LoadersIndexScreen() {
  const data = useLoaderData<typeof loader>();
  const [count, setCount] = useState(0);
  return (
    <RouteDetails>
      <LoaderData value={data} />
      <Section title="Client state">
        <Panel>
          <Button
            testID="index-increment"
            title="Increment"
            onPress={() => setCount((c) => c + 1)}
          />
          <Json value={count} testID="index-count" />
        </Panel>
      </Section>
    </RouteDetails>
  );
}
