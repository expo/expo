import { getComponent } from '../../data/libs';
import { Head } from '../../components/head';
import { useSearchParams } from 'expo-router';

export default function Library() {
  const { library } = useSearchParams();

  const Component = getComponent(library);

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
