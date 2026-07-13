import { render, screen } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';
import { Text } from 'react-native';

import { ExpoRoot } from '../ExpoRoot';
import {
  useLocalSearchParams,
  usePathname,
  useUnstableGlobalHref,
} from '../exports';
import { getMockContext } from '../testing-library';
import { maybeHideSplashScreen } from '../utils/splash';

jest.mock('../utils/splash', () => ({
  maybeHideSplashScreen: jest.fn(),
}));

const mockMaybeHideSplashScreen = maybeHideSplashScreen as jest.MockedFunction<
  typeof maybeHideSplashScreen
>;

it('waits for the root navigator to commit before hiding the splash screen', () => {
  let renderChildren = false;

  function Wrapper({ children }: PropsWithChildren) {
    return renderChildren ? children : null;
  }

  const context = getMockContext({
    _layout: () => <Text>Layout</Text>,
    index: () => <Text>Index</Text>,
  });
  const result = render(<ExpoRoot context={context} location="/" wrapper={Wrapper} />);

  expect(mockMaybeHideSplashScreen).not.toHaveBeenCalled();

  renderChildren = true;
  result.rerender(<ExpoRoot context={context} location="/" wrapper={Wrapper} />);

  expect(mockMaybeHideSplashScreen).toHaveBeenCalledTimes(1);
});

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
