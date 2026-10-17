import { act, render, screen, waitFor } from '@testing-library/react-native';
import { Suspense, type ReactElement } from 'react';
import { View } from 'react-native';

import type { RouteNode } from '../Route';
import { createAsyncScreenComponent } from '../useScreens';
import { Try, type ErrorBoundaryProps } from '../views/Try';

it('loads an async route again only when its error boundary retries', async () => {
  const loadRoute = jest
    .fn<Promise<object>, []>()
    .mockRejectedValueOnce(new Error('First load failed'))
    .mockRejectedValueOnce(new Error('Second load failed'))
    .mockResolvedValue({ default: () => <View testID="second" /> });
  // An async route's `loadRoute` returns a promise, which the `RouteNode` type does not allow.
  const node = {
    type: 'route',
    route: 'second',
    contextKey: './second.tsx',
    children: [],
    dynamic: null,
    loadRoute,
  } as unknown as RouteNode;
  const Screen = createAsyncScreenComponent(node);
  const Boundary = jest.fn<ReactElement, [ErrorBoundaryProps]>(() => <View testID="boundary" />);
  const boundaryProps = () => Boundary.mock.calls.at(-1)![0];
  // `retry` resolves after the boundary rerenders, which does not happen while the route still fails.
  const retry = () =>
    act(async () => {
      boundaryProps().retry();
    });

  await render(
    <Try catch={Boundary}>
      <Suspense fallback={null}>
        <Screen />
      </Suspense>
    </Try>
  );

  expect(await screen.findByTestId('boundary')).toBeOnTheScreen();
  expect(boundaryProps().error.message).toBe('First load failed');
  expect(loadRoute).toHaveBeenCalledTimes(1);

  await retry();

  await waitFor(() => expect(boundaryProps().error.message).toBe('Second load failed'));
  expect(loadRoute).toHaveBeenCalledTimes(2);

  await retry();

  expect(await screen.findByTestId('second')).toBeOnTheScreen();
  expect(loadRoute).toHaveBeenCalledTimes(3);
});
