import { act, render, screen } from '@testing-library/react-native';
import type { ComponentProps, PropsWithChildren } from 'react';
import { Text } from 'react-native';

import { ExpoRoot, type ExpoRootProps } from '../ExpoRoot';
import { router } from '../imperative-api';
import { getMockContext } from '../testing-library';
import { maybeHideSplashScreen } from '../utils/splash';

jest.mock('../utils/splash', () => ({
  maybeHideSplashScreen: jest.fn(),
}));

const mockMaybeHideSplashScreen = maybeHideSplashScreen as jest.MockedFunction<
  typeof maybeHideSplashScreen
>;

it('waits for the root navigator to commit before hiding the splash screen', async () => {
  let renderChildren = false;

  function Wrapper({ children }: PropsWithChildren) {
    return renderChildren ? children : null;
  }

  const context = getMockContext({
    _layout: () => <Text>Layout</Text>,
    index: () => <Text>Index</Text>,
  });
  const result = await render(<ExpoRoot context={context} location="/" wrapper={Wrapper} />);

  expect(mockMaybeHideSplashScreen).not.toHaveBeenCalled();

  renderChildren = true;
  await result.rerender(<ExpoRoot context={context} location="/" wrapper={Wrapper} />);

  expect(mockMaybeHideSplashScreen).toHaveBeenCalledTimes(1);
});

it('passes the pathname and params to the wrapper', async () => {
  function Wrapper({
    children,
    pathname,
    params,
  }: ComponentProps<NonNullable<ExpoRootProps['wrapper']>>) {
    return (
      <>
        <Text testID="wrapper">{`${pathname} ${JSON.stringify(params)}`}</Text>
        {children}
      </>
    );
  }

  const context = getMockContext({
    'posts/[id]': () => <Text>Post</Text>,
  });
  await render(<ExpoRoot context={context} location="/posts/123?draft=true" wrapper={Wrapper} />);

  expect(screen.getByTestId('wrapper')).toHaveTextContent('/posts/123 {"id":"123","draft":"true"}');

  await act(() => router.push('/posts/456'));

  expect(screen.getByTestId('wrapper')).toHaveTextContent('/posts/456 {"id":"456"}');
});
