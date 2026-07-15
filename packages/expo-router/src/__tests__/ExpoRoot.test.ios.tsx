import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ExpoRoot } from '../ExpoRoot';
import {
  useLocalSearchParams,
  usePathname,
  useUnstableGlobalHref,
} from '../exports';
import { getMockContext } from '../testing-library';

function LocationProbe() {
  const pathname = usePathname();
  const href = useUnstableGlobalHref();
  const params = useLocalSearchParams();

  return (
    <>
      <Text testID="pathname">{pathname}</Text>
      <Text testID="href">{href}</Text>
      <Text testID="query">{String(params.query)}</Text>
    </>
  );
}

function renderExpoRoot(location: string | URL) {
  render(
    <ExpoRoot
      context={getMockContext({
        'profile/[id]': LocationProbe,
        docs: LocationProbe,
      })}
      location={location}
    />
  );
}

it('uses a string location prop to initialize SSR route state', () => {
  renderExpoRoot('https://example.com/profile/evan?query=hello#section');

  expect(screen.getByTestId('pathname')).toHaveTextContent('/profile/evan');
  expect(screen.getByTestId('href')).toHaveTextContent(
    '/profile/evan?query=hello#section'
  );
  expect(screen.getByTestId('query')).toHaveTextContent('hello');
});

it('uses a URL location prop to initialize SSR route state', () => {
  renderExpoRoot(new URL('https://example.com/docs?query=world'));

  expect(screen.getByTestId('pathname')).toHaveTextContent('/docs');
  expect(screen.getByTestId('href')).toHaveTextContent('/docs?query=world');
  expect(screen.getByTestId('query')).toHaveTextContent('world');
});
