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
    data: 'hmr-index',
  });
}

export default function HmrIndexRoute() {
  return (
    <Page title="HMR" testID="hmr-index">
      <Suspense fallback={<Loading />}>
        <HmrIndexScreen />
      </Suspense>
      <Section title="Posts">
        <RouteLinks>
          <RouteLink href="/hmr/posts/hmr-post-1" />
        </RouteLinks>
      </Section>
    </Page>
  );
}

function HmrIndexScreen() {
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
