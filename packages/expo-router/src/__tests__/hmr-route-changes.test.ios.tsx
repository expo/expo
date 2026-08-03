import { jest } from '@jest/globals';
import { act, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Text } from 'react-native';

import { ExpoRoot } from '../ExpoRoot';
import { store } from '../global-state/router-store';
import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import { getMockContext, renderRouter } from '../testing-library';
import { TabList, TabSlot, TabTrigger, Tabs as HeadlessTabs } from '../ui';

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

it('repairs state when all screen files are replaced', () => {
  const routes: Record<string, () => ReactElement | null> = {
    _layout: () => <Stack />,
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
  };

  const result = renderRouter(routes, { initialUrl: '/second' });
  expect(screen.getByTestId('second')).toBeVisible();

  delete routes.index;
  delete routes.second;
  routes.third = () => <Text testID="third">Third</Text>;
  routes.fourth = () => <Text testID="fourth">Fourth</Text>;

  expect(() =>
    result.rerender(<ExpoRoot context={getMockContext(routes)} location="/second" />)
  ).not.toThrow();

  const state = result.getRouterState()!.routes[0]!.state!;
  expect(state.routeNames).toStrictEqual(['third', 'fourth']);
  expect(state.routes.map((route) => route.name)).toStrictEqual(['third']);
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
  const replace = jest.spyOn(router, 'replace');

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
  expect(replace).not.toHaveBeenCalled();
  replace.mockRestore();
});

it('does not redirect when the focused headless tab trigger is removed', () => {
  let showSecond = true;
  const routes: Record<string, () => ReactElement | null> = {
    _layout: () => (
      <HeadlessTabs>
        <TabList>
          <TabTrigger name="index" href="/" />
          {showSecond && <TabTrigger name="second" href="/second" />}
        </TabList>
        <TabSlot />
      </HeadlessTabs>
    ),
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
  };

  const result = renderRouter(routes, { initialUrl: '/second' });
  expect(screen.getByTestId('second')).toBeVisible();
  const replace = jest.spyOn(router, 'replace');

  showSecond = false;
  delete routes.second;
  result.rerender(<ExpoRoot context={getMockContext(routes)} location="/second" />);

  expect(replace).not.toHaveBeenCalled();
  replace.mockRestore();
});
