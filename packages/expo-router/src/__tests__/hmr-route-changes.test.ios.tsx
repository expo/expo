import { jest } from '@jest/globals';
import { act, screen } from '@testing-library/react-native';
import { useCallback, type ReactElement } from 'react';
import { Text } from 'react-native';

import { ExpoRoot } from '../ExpoRoot';
import { navigationRef } from '../global-state/navigationRef';
import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import TopTabs from '../layouts/TopTabs';
import { useFocusEffect } from '../react-navigation/core';
import { usePreventRemove } from '../react-navigation/native';
import { getMockContext, renderRouter } from '../testing-library';
import { TabList, TabSlot, TabTrigger, Tabs as HeadlessTabs } from '../ui';
import { Slot } from '../views/Navigator';

it('preserves live navigation state when the initial location changes on re-render', async () => {
  const routes = {
    _layout: () => (
      <Stack>
        <Stack.Screen name="index" />
        <Stack.Screen name="second" />
      </Stack>
    ),
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
  };
  const result = await renderRouter(routes, { initialUrl: '/' });
  await act(() => router.push('/second'));
  const navigationState = navigationRef.getRootState();

  await result.rerender(<ExpoRoot context={getMockContext(routes)} location="/second" />);

  expect(navigationRef.getRootState()).toStrictEqual(navigationState);
  expect(screen.getByTestId('second')).toBeVisible();
});

it('does not crash when a route file is removed and the app re-renders', async () => {
  const routes: Record<string, () => ReactElement | null> = {
    _layout: () => <Stack />,
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
  };

  const result = await renderRouter(routes, { initialUrl: '/' });
  expect(screen.getByTestId('index')).toBeVisible();

  // Simulate the file deletion: `inMemoryContext.keys()` reads this record live.
  delete routes.second;

  await expect(
    result.rerender(<ExpoRoot context={getMockContext(routes)} location="/" />)
  ).resolves.not.toThrow();

  expect(screen.getByTestId('index')).toBeVisible();
  expect(result.getRouterState()!.routes[0]!.state!.routeNames).toStrictEqual(['index']);
});

it('does not crash when a route file is added and the app re-renders', async () => {
  const routes: Record<string, () => ReactElement | null> = {
    _layout: () => <Stack />,
    index: () => <Text testID="index">Index</Text>,
  };

  const result = await renderRouter(routes, { initialUrl: '/' });
  expect(screen.getByTestId('index')).toBeVisible();

  // Simulate a new route file appearing.
  routes.second = () => <Text testID="second">Second</Text>;

  await expect(
    result.rerender(<ExpoRoot context={getMockContext(routes)} location="/" />)
  ).resolves.not.toThrow();

  // The new route is registered and reachable.
  expect(result.getRouterState()!.routes[0]!.state!.routeNames).toContain('second');
  await act(() => router.navigate('/second'));
  expect(screen.getByTestId('second')).toBeVisible();
});

// TODO(@ubax): seed the new nested navigator before it renders; intent deduplication alone
// cannot repair the missing child state synchronously.
// https://linear.app/expo/issue/ENG-26163/fix-hot-module-reloading-by-utilizing-global-state
it.skip('seeds state when a route gains a nested layout', async () => {
  const routes: Record<string, () => ReactElement | null> = {
    _layout: () => <Stack />,
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
  };

  const result = await renderRouter(routes, { initialUrl: '/second' });
  expect(screen.getByTestId('second')).toBeVisible();

  delete routes.second;
  routes['second/_layout'] = () => <Stack />;
  routes['second/index'] = () => <Text testID="second-index">Second index</Text>;

  await expect(
    result.rerender(<ExpoRoot context={getMockContext(routes)} location="/second" />)
  ).resolves.not.toThrow();
  expect(screen.getByTestId('second-index')).toBeVisible();
});

it('does not crash when the currently focused route file is removed', async () => {
  const routes: Record<string, () => ReactElement | null> = {
    _layout: () => <Stack />,
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
  };

  const result = await renderRouter(routes, { initialUrl: '/second' });
  expect(screen.getByTestId('second')).toBeVisible();

  delete routes.second;

  await expect(
    result.rerender(<ExpoRoot context={getMockContext(routes)} location="/second" />)
  ).resolves.not.toThrow();

  expect(result.getRouterState()!.routes[0]!.state!.routeNames).toStrictEqual(['index']);
});

it('does not allow removal prevention to block route file changes', async () => {
  const beforeRemove = jest.fn();
  const Second = () => {
    usePreventRemove(true, beforeRemove);
    return <Text testID="second">Second</Text>;
  };
  const routes: Record<string, () => ReactElement | null> = {
    _layout: () => <Stack />,
    index: () => <Text testID="index">Index</Text>,
    second: Second,
  };

  const result = await renderRouter(routes, { initialUrl: '/second' });
  delete routes.second;

  await result.rerender(<ExpoRoot context={getMockContext(routes)} location="/second" />);

  expect(beforeRemove).not.toHaveBeenCalled();
  expect(result.getRouterState()!.routes[0]!.state!.routeNames).toStrictEqual(['index']);
});

it('does not crash when a route file is renamed after navigation', async () => {
  const routes: Record<string, () => ReactElement | null> = {
    _layout: () => <Stack />,
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
  };

  const result = await renderRouter(routes, { initialUrl: '/' });
  await act(() => router.push('/second'));
  expect(screen.getByTestId('second')).toBeVisible();

  delete routes.second;
  routes.third = () => <Text testID="third">Third</Text>;

  await expect(
    result.rerender(<ExpoRoot context={getMockContext(routes)} location="/" />)
  ).resolves.not.toThrow();

  expect(screen.getByTestId('index')).toBeVisible();
  expect(navigationRef.current?.getRootState().routes[0]!.state!.routeNames).toStrictEqual([
    'index',
    'third',
  ]);
});

it('repairs state when all screen files are replaced', async () => {
  const routes: Record<string, () => ReactElement | null> = {
    _layout: () => <Stack />,
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
  };

  const result = await renderRouter(routes, { initialUrl: '/second' });
  expect(screen.getByTestId('second')).toBeVisible();

  delete routes.index;
  delete routes.second;
  routes.third = () => <Text testID="third">Third</Text>;
  routes.fourth = () => <Text testID="fourth">Fourth</Text>;

  await expect(
    result.rerender(<ExpoRoot context={getMockContext(routes)} location="/second" />)
  ).resolves.not.toThrow();

  const state = result.getRouterState()!.routes[0]!.state!;
  expect(state.routeNames).toStrictEqual(['third', 'fourth']);
  expect(state.routes.map((route) => route.name)).toStrictEqual(['third']);
});

it('repairs Slot state when all screen files are replaced', async () => {
  const routes: Record<string, () => ReactElement | null> = {
    _layout: () => <Slot />,
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
  };

  const result = await renderRouter(routes, { initialUrl: '/second' });
  expect(screen.getByTestId('second')).toBeVisible();

  delete routes.index;
  delete routes.second;
  routes.third = () => <Text testID="third">Third</Text>;
  routes.fourth = () => <Text testID="fourth">Fourth</Text>;

  await expect(
    result.rerender(<ExpoRoot context={getMockContext(routes)} location="/second" />)
  ).resolves.not.toThrow();

  const state = result.getRouterState()!.routes[0]!.state!;
  expect(state.routeNames).toStrictEqual(['third', 'fourth']);
  expect(state.routes.map((route) => route.name)).toStrictEqual(['third']);
});

it('repairs top tabs state when all screen files are replaced', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const routes: Record<string, () => ReactElement | null> = {
    _layout: () => {
      const screens = [];
      if (routes.index) screens.push(<TopTabs.Screen key="index" name="index" />);
      if (routes.second) screens.push(<TopTabs.Screen key="second" name="second" />);
      if (routes.third) screens.push(<TopTabs.Screen key="third" name="third" />);
      if (routes.fourth) screens.push(<TopTabs.Screen key="fourth" name="fourth" />);
      return <TopTabs>{screens}</TopTabs>;
    },
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
  };

  const result = await renderRouter(routes, { initialUrl: '/second' });
  expect(screen.getByTestId('second')).toBeVisible();

  delete routes.index;
  delete routes.second;
  routes.third = () => <Text testID="third">Third</Text>;
  routes.fourth = () => <Text testID="fourth">Fourth</Text>;

  await expect(
    result.rerender(<ExpoRoot context={getMockContext(routes)} location="/second" />)
  ).resolves.not.toThrow();

  const state = result.getRouterState()!.routes[0]!.state!;
  expect(state.routeNames).toStrictEqual(['third', 'fourth']);
  expect(state.routes.map((route) => route.name)).toStrictEqual(['third', 'fourth']);
  expect(warn).not.toHaveBeenCalled();
  warn.mockRestore();
});

it('preserves surviving stack history when a route file is renamed', async () => {
  const routes: Record<string, () => ReactElement | null> = {
    _layout: () => <Stack />,
    index: () => <Text testID="index">Index</Text>,
    details: () => <Text testID="details">Details</Text>,
    second: () => <Text testID="second">Second</Text>,
  };

  const result = await renderRouter(routes, { initialUrl: '/' });
  await act(() => router.push('/details'));
  await act(() => router.push('/second'));
  expect(screen.getByTestId('second')).toBeVisible();

  delete routes.second;
  routes.third = () => <Text testID="third">Third</Text>;

  await expect(
    result.rerender(<ExpoRoot context={getMockContext(routes)} location="/" />)
  ).resolves.not.toThrow();

  expect(screen.getByTestId('details')).toBeVisible();
  expect(
    navigationRef.current?.getRootState().routes[0]!.state!.routes.map((route) => route.name)
  ).toStrictEqual(['index', 'details']);

  await act(() => router.back());
  expect(screen.getByTestId('index')).toBeVisible();
});

it('does not crash when a tab route file is renamed after navigation', async () => {
  const routes: Record<string, () => ReactElement | null> = {
    _layout: () => {
      const screens = [<Tabs.Screen key="index" name="index" />];
      if (routes.second) screens.push(<Tabs.Screen key="second" name="second" />);
      if (routes.third) screens.push(<Tabs.Screen key="third" name="third" />);
      return <Tabs>{screens}</Tabs>;
    },
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
  };

  const result = await renderRouter(routes, { initialUrl: '/' });
  await act(() => router.push('/second'));
  expect(screen.getByTestId('second')).toBeVisible();
  const replace = jest.spyOn(router, 'replace');

  delete routes.second;
  routes.third = () => <Text testID="third">Third</Text>;

  await expect(
    result.rerender(<ExpoRoot context={getMockContext(routes)} location="/" />)
  ).resolves.not.toThrow();

  expect(screen.getByTestId('index')).toBeVisible();
  expect(navigationRef.current?.getRootState().routes[0]!.state!.routeNames).toStrictEqual([
    'index',
    'third',
  ]);
  expect(replace).not.toHaveBeenCalled();
  replace.mockRestore();
});

it('focuses the first tab when the focused third tab is removed', async () => {
  const routes: Record<string, () => ReactElement | null> = {
    _layout: () => {
      const screens = [
        <Tabs.Screen key="index" name="index" />,
        <Tabs.Screen key="second" name="second" />,
      ];
      if (routes.third) screens.push(<Tabs.Screen key="third" name="third" />);
      return <Tabs>{screens}</Tabs>;
    },
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
    third: () => <Text testID="third">Third</Text>,
  };

  const result = await renderRouter(routes, { initialUrl: '/' });
  await act(() => router.push('/third'));
  expect(screen.getByTestId('third')).toBeVisible();

  delete routes.third;
  await result.rerender(<ExpoRoot context={getMockContext(routes)} location="/" />);

  const state = result.getRouterState()!.routes[0]!.state!;
  expect(state.index).toBe(0);
  expect(state.routeNames).toStrictEqual(['index', 'second']);
  expect(screen.getByTestId('index')).toBeVisible();
});

it('does not redirect when the focused headless tab trigger is removed', async () => {
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

  const result = await renderRouter(routes, { initialUrl: '/second' });
  expect(screen.getByTestId('second')).toBeVisible();
  const replace = jest.spyOn(router, 'replace');

  showSecond = false;
  delete routes.second;
  await result.rerender(<ExpoRoot context={getMockContext(routes)} location="/second" />);

  expect(replace).not.toHaveBeenCalled();
  replace.mockRestore();
});

it('does not focus an unrelated tab while reconciling a removed focused tab', async () => {
  const focusEvents: string[] = [];
  const Screen = ({ name }: { name: string }) => {
    useFocusEffect(
      useCallback(() => {
        focusEvents.push(`focus:${name}`);
        return () => focusEvents.push(`blur:${name}`);
      }, [name])
    );
    return <Text testID={name}>{name}</Text>;
  };
  const routes: Record<string, () => ReactElement | null> = {
    _layout: () => {
      const screens = [
        <Tabs.Screen key="index" name="index" />,
        <Tabs.Screen key="second" name="second" />,
      ];
      if (routes.third) screens.push(<Tabs.Screen key="third" name="third" />);
      return <Tabs>{screens}</Tabs>;
    },
    index: () => <Screen name="index" />,
    second: () => <Screen name="second" />,
    third: () => <Screen name="third" />,
  };

  const result = await renderRouter(routes, { initialUrl: '/' });
  await act(() => router.push('/third'));
  focusEvents.length = 0;

  delete routes.third;
  await result.rerender(<ExpoRoot context={getMockContext(routes)} location="/" />);

  // The interim render must not focus `second`: the router focuses `index`, and a stray focus
  // there runs a screen's `useFocusEffect` for a tab the user never selected.
  expect(focusEvents).toStrictEqual(['blur:third', 'focus:index']);
});

it('focuses the surviving top route when the focused stack route is removed', async () => {
  const focusEvents: string[] = [];
  const Screen = ({ name }: { name: string }) => {
    useFocusEffect(
      useCallback(() => {
        focusEvents.push(`focus:${name}`);
        return () => focusEvents.push(`blur:${name}`);
      }, [name])
    );
    return <Text testID={name}>{name}</Text>;
  };
  const routes: Record<string, () => ReactElement | null> = {
    _layout: () => <Stack />,
    index: () => <Screen name="index" />,
    details: () => <Screen name="details" />,
    third: () => <Screen name="third" />,
  };

  const result = await renderRouter(routes, { initialUrl: '/' });
  await act(() => router.push('/details'));
  await act(() => router.push('/third'));
  focusEvents.length = 0;

  delete routes.third;
  await result.rerender(<ExpoRoot context={getMockContext(routes)} location="/" />);

  // A stack focuses the survivor below the removed route, so `index` must never be focused.
  expect(focusEvents).toStrictEqual(['blur:third', 'focus:details']);
});
