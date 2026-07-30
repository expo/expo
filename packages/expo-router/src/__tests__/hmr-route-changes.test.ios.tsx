import { act, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Text } from 'react-native';

import { ExpoRoot } from '../ExpoRoot';
import { store } from '../global-state/router-store';
import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import { getMockContext, renderRouter } from '../testing-library';

it('does not crash when a route file is removed and the app re-renders', () => {
  const routes: Record<string, () => ReactElement | null> = {
    _layout: () => <Stack />,
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
  };

  const result = renderRouter(routes, { initialUrl: '/' });
  expect(screen.getByTestId('index')).toBeVisible();

  // Simulate the file deletion: `inMemoryContext.keys()` reads this record live.
  delete routes.second;

  expect(() =>
    result.rerender(<ExpoRoot context={getMockContext(routes)} location="/" />)
  ).not.toThrow();

  expect(screen.getByTestId('index')).toBeVisible();
  expect(result.getRouterState()!.routes[0]!.state!.routeNames).toStrictEqual(['index']);
});

it('does not crash when a route file is added and the app re-renders', () => {
  const routes: Record<string, () => ReactElement | null> = {
    _layout: () => <Stack />,
    index: () => <Text testID="index">Index</Text>,
  };

  const result = renderRouter(routes, { initialUrl: '/' });
  expect(screen.getByTestId('index')).toBeVisible();

  // Simulate a new route file appearing.
  routes.second = () => <Text testID="second">Second</Text>;

  expect(() =>
    result.rerender(<ExpoRoot context={getMockContext(routes)} location="/" />)
  ).not.toThrow();

  // The new route is registered and reachable.
  expect(result.getRouterState()!.routes[0]!.state!.routeNames).toContain('second');
  act(() => router.navigate('/second'));
  expect(screen.getByTestId('second')).toBeVisible();
});

it('does not crash when the currently focused route file is removed', () => {
  const routes: Record<string, () => ReactElement | null> = {
    _layout: () => <Stack />,
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
  };

  const result = renderRouter(routes, { initialUrl: '/second' });
  expect(screen.getByTestId('second')).toBeVisible();

  delete routes.second;

  expect(() =>
    result.rerender(<ExpoRoot context={getMockContext(routes)} location="/second" />)
  ).not.toThrow();

  expect(result.getRouterState()!.routes[0]!.state!.routeNames).toStrictEqual(['index']);
});

it('does not crash when a route file is renamed after navigation', () => {
  const routes: Record<string, () => ReactElement | null> = {
    _layout: () => <Stack />,
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
  };

  const result = renderRouter(routes, { initialUrl: '/' });
  act(() => router.push('/second'));
  expect(screen.getByTestId('second')).toBeVisible();

  delete routes.second;
  routes.third = () => <Text testID="third">Third</Text>;

  expect(() =>
    result.rerender(<ExpoRoot context={getMockContext(routes)} location="/" />)
  ).not.toThrow();

  expect(screen.getByTestId('index')).toBeVisible();
  expect(store.navigationRef.current?.getRootState().routes[0]!.state!.routeNames).toStrictEqual([
    'index',
    'third',
  ]);
});

it('preserves surviving stack history when a route file is renamed', () => {
  const routes: Record<string, () => ReactElement | null> = {
    _layout: () => <Stack />,
    index: () => <Text testID="index">Index</Text>,
    details: () => <Text testID="details">Details</Text>,
    second: () => <Text testID="second">Second</Text>,
  };

  const result = renderRouter(routes, { initialUrl: '/' });
  act(() => router.push('/details'));
  act(() => router.push('/second'));
  expect(screen.getByTestId('second')).toBeVisible();

  delete routes.second;
  routes.third = () => <Text testID="third">Third</Text>;

  expect(() =>
    result.rerender(<ExpoRoot context={getMockContext(routes)} location="/" />)
  ).not.toThrow();

  expect(screen.getByTestId('details')).toBeVisible();
  expect(
    store.navigationRef.current?.getRootState().routes[0]!.state!.routes.map((route) => route.name)
  ).toStrictEqual(['index', 'details']);

  act(() => router.back());
  expect(screen.getByTestId('index')).toBeVisible();
});

it('does not crash when a tab route file is renamed after navigation', () => {
  const routes: Record<string, () => ReactElement | null> = {
    _layout: () => <Tabs />,
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
  };

  const result = renderRouter(routes, { initialUrl: '/' });
  act(() => router.push('/second'));
  expect(screen.getByTestId('second')).toBeVisible();

  delete routes.second;
  routes.third = () => <Text testID="third">Third</Text>;

  expect(() =>
    result.rerender(<ExpoRoot context={getMockContext(routes)} location="/" />)
  ).not.toThrow();

  expect(screen.getByTestId('index')).toBeVisible();
  expect(store.navigationRef.current?.getRootState().routes[0]!.state!.routeNames).toStrictEqual([
    'index',
    'third',
  ]);
});

it('reconciles a JS Tabs route-name change without an unhandled-action warning', () => {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  try {
    const routes: Record<string, () => ReactElement | null> = {
      _layout: () => <Tabs />,
      index: () => <Text testID="index">Index</Text>,
      second: () => <Text testID="second">Second</Text>,
    };

    const result = renderRouter(routes, { initialUrl: '/' });
    expect(screen.getByTestId('index')).toBeVisible();

    delete routes.second;

    expect(() =>
      result.rerender(<ExpoRoot context={getMockContext(routes)} location="/" />)
    ).not.toThrow();

    expect(screen.getByTestId('index')).toBeVisible();
    expect(result.getRouterState()!.routes[0]!.state!.routeNames).toStrictEqual(['index']);

    const unhandledActionWarnings = errorSpy.mock.calls.filter(
      ([message]) =>
        typeof message === 'string' && message.includes('was not handled by any navigator')
    );
    expect(unhandledActionWarnings).toEqual([]);
  } finally {
    errorSpy.mockRestore();
  }
});
