import { getComponent } from '../../data/libs';
import { useSearchParams } from 'expo-router';

export default function Library() {
  const { library } = useSearchParams();

  const Component = getComponent(library);

  if (!Component) {
    return <p>Unknown library: {library}</p>;
  }

  return <Component />;
}
