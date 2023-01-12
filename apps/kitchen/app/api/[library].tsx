import { useSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { Head } from '../../components/head';
import { getComponent } from '../../data/libs';

export default function Library() {
  const { library } = useSearchParams();

  const Component = useMemo(() => getComponent(library), [library]);

  if (!Component) {
    return <p>Unknown library: {library}</p>;
  }

  return (
    <>
      <Head>
        <title>{library}</title>
      </Head>
      <Component />
    </>
  );
}
