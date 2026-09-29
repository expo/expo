import { render } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';
import { Text } from 'react-native';

import { ExpoRoot } from '../ExpoRoot';
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
