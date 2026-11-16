import { Suspense, use, useEffect, useState } from 'react';
import { Text } from 'react-native';

const clientResource = new Promise<string>(() => {});

function createResource(delay: number) {
  // Only the server can provide this content, so client rendering cannot hide lost server DOM.
  return typeof window === 'undefined'
    ? new Promise<string>((resolve) => setTimeout(() => resolve('Streamed content'), delay))
    : clientResource;
}

function Content({ resource, id }: { resource: Promise<string>; id: string }) {
  return <p id={id}>{use(resource)}</p>;
}

function Shell() {
  const [mounted, setMounted] = useState(false);
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <Text testID="hydration-status">{mounted ? 'mounted' : 'unmounted'}</Text>
      <Text testID="click-status">{clicked ? 'clicked' : 'unclicked'}</Text>
      <button id="shell" onClick={() => setClicked(true)}>
        Interactive shell
      </button>
    </>
  );
}

export default function SafeAreaStreamingPage() {
  const [resources] = useState(() => [createResource(5000), createResource(7000)]);

  return (
    <main className="safe-area-content">
      <Shell />
      <section>
        <Suspense fallback={<p id="first-fallback">First pending</p>}>
          <Content id="first" resource={resources[0]} />
        </Suspense>
        <Suspense fallback={<p id="second-fallback">Second pending</p>}>
          <Content id="second" resource={resources[1]} />
        </Suspense>
      </section>
    </main>
  );
}
