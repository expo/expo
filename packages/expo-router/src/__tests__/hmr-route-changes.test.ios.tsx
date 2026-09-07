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

it('preserves live navigation state when the initial location changes on re-render', () => {
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
  const result = renderRouter(routes, { initialUrl: '/' });
  act(() => router.push('/second'));
  const navigationState = navigationRef.getRootState();

  result.rerender(<ExpoRoot context={getMockContext(routes)} location="/second" />);

  expect(navigationRef.getRootState()).toStrictEqual(navigationState);
  expect(screen.getByTestId('second')).toBeVisible();
});

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

it('seeds state when a route gains a nested layout', () => {
  const routes: Record<string, () => ReactElement | null> = {
    _layout: () => <Stack />,
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
  };

  const result = renderRouter(routes, { initialUrl: '/second' });
  expect(screen.getByTestId('second')).toBeVisible();

  delete routes.second;
  routes['second/_layout'] = () => <Stack />;
  routes['second/index'] = () => <Text testID="second-index">Second index</Text>;

  expect(() =>
    result.rerender(<ExpoRoot context={getMockContext(routes)} location="/second" />)
  ).not.toThrow();
  expect(screen.getByTestId('second-index')).toBeVisible();
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

it('does not allow removal prevention to block route file changes', () => {
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

  const result = renderRouter(routes, { initialUrl: '/second' });
  delete routes.second;

  result.rerender(<ExpoRoot context={getMockContext(routes)} location="/second" />);

  expect(beforeRemove).not.toHaveBeenCalled();
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
  expect(navigationRef.current?.getRootState().routes[0]!.state!.routeNames).toStrictEqual([
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

it('repairs Slot state when all screen files are replaced', () => {
  const routes: Record<string, () => ReactElement | null> = {
    _layout: () => <Slot />,
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

it('repairs top tabs state when all screen files are replaced', () => {
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
  expect(state.routes.map((route) => route.name)).toStrictEqual(['third', 'fourth']);
  expect(warn).not.toHaveBeenCalled();
  warn.mockRestore();
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
    navigationRef.current?.getRootState().routes[0]!.state!.routes.map((route) => route.name)
  ).toStrictEqual(['index', 'details']);

  act(() => router.back());
  expect(screen.getByTestId('index')).toBeVisible();
});

it('does not crash when a tab route file is renamed after navigation', () => {
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
  expect(navigationRef.current?.getRootState().routes[0]!.state!.routeNames).toStrictEqual([
    'index',
    'third',
  ]);
  expect(replace).not.toHaveBeenCalled();
  replace.mockRestore();
});

it('focuses the first tab when the focused third tab is removed', () => {
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

  const result = renderRouter(routes, { initialUrl: '/' });
  act(() => router.push('/third'));
  expect(screen.getByTestId('third')).toBeVisible();

  delete routes.third;
  result.rerender(<ExpoRoot context={getMockContext(routes)} location="/" />);

  const state = result.getRouterState()!.routes[0]!.state!;
  expect(state.index).toBe(0);
  expect(state.routeNames).toStrictEqual(['index', 'second']);
  expect(screen.getByTestId('index')).toBeVisible();
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

it('does not focus an unrelated tab while reconciling a removed focused tab', () => {
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

  const result = renderRouter(routes, { initialUrl: '/' });
  act(() => router.push('/third'));
  focusEvents.length = 0;

  delete routes.third;
  result.rerender(<ExpoRoot context={getMockContext(routes)} location="/" />);

  // The interim render must not focus `second`: the router focuses `index`, and a stray focus
  // there runs a screen's `useFocusEffect` for a tab the user never selected.
  expect(focusEvents).toStrictEqual(['blur:third', 'focus:index']);
});

it('focuses the surviving top route when the focused stack route is removed', () => {
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

  const result = renderRouter(routes, { initialUrl: '/' });
  act(() => router.push('/details'));
  act(() => router.push('/third'));
  focusEvents.length = 0;

  delete routes.third;
  result.rerender(<ExpoRoot context={getMockContext(routes)} location="/" />);

  // A stack focuses the survivor below the removed route, so `index` must never be focused.
  expect(focusEvents).toStrictEqual(['blur:third', 'focus:details']);
});

it('reconciles a renamed route in an unmounted nested layout', () => {
  const AccountLayout = jest.fn(() => <Stack />);
  const routes: Record<string, () => ReactElement | null> = {
    _layout: () => <Tabs />,
    index: () => <Text testID="index">Index</Text>,
    'account/_layout': AccountLayout,
    'account/index': () => <Text testID="account-index">Account</Text>,
    'account/old': () => <Text testID="old">Old</Text>,
  };

  const result = renderRouter(routes, { initialUrl: '/account' });
  expect(AccountLayout).not.toHaveBeenCalled();

  delete routes['account/old'];
  routes['account/new'] = () => <Text testID="new">New</Text>;
  result.rerender(<ExpoRoot context={getMockContext(routes)} location="/" />);

  expect(AccountLayout).not.toHaveBeenCalled();
  const appState = result.getRouterState()!.routes[0]!.state!;
  const accountState = appState.routes.find((route) => route.name === 'account')?.state;
  expect(accountState).toMatchObject({
    routeNames: ['index', 'new'],
    routes: [expect.objectContaining({ name: 'index' })],
  });
});

it('restores declared tab order after a route is renamed', () => {
  const routes: Record<string, () => ReactElement | null> = {
    _layout: () => {
      const screens = [];
      if (routes.second) screens.push(<Tabs.Screen key="second" name="second" />);
      if (routes.fourth) screens.push(<Tabs.Screen key="fourth" name="fourth" />);
      screens.push(<Tabs.Screen key="index" name="index" />);
      screens.push(<Tabs.Screen key="third" name="third" />);
      return <Tabs backBehavior="order">{screens}</Tabs>;
    },
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
    third: () => <Text testID="third">Third</Text>,
  };

  const result = renderRouter(routes, { initialUrl: '/' });
  expect(result.getRouterState()!.routes[0]!.state!.routes.map(({ name }) => name)).toEqual([
    'second',
    'index',
    'third',
  ]);
  delete routes.second;
  routes.fourth = () => <Text testID="fourth">Fourth</Text>;
  result.rerender(<ExpoRoot context={getMockContext(routes)} location="/" />);

  const state = result.getRouterState()!.routes[0]!.state!;
  expect(state.routes.map(({ name }) => name)).toEqual(['fourth', 'index', 'third']);
  expect(state.routes[state.index ?? -1]?.name).toBe('index');
});

it('repairs full tab history when the focused route is removed', () => {
  const routes: Record<string, () => ReactElement | null> = {
    _layout: () => <Tabs backBehavior="fullHistory" />,
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
    third: () => <Text testID="third">Third</Text>,
  };

  const result = renderRouter(routes, { initialUrl: '/' });
  act(() => router.navigate('/second'));
  act(() => router.navigate('/third'));
  const removedKey = result
    .getRouterState()!
    .routes[0]!.state!.routes.find(({ name }) => name === 'third')!.key;

  delete routes.third;
  result.rerender(<ExpoRoot context={getMockContext(routes)} location="/" />);

  const state = result.getRouterState()!.routes[0]!.state!;
  const focusedRoute = state.routes[state.index ?? -1];
  expect(focusedRoute?.name).toBe('index');
  expect(state.history).not.toEqual(
    expect.arrayContaining([expect.objectContaining({ key: removedKey })])
  );
  expect(state.history?.at(-1)).toMatchObject({
    type: 'route',
    key: focusedRoute!.key,
  });

  act(() => router.back());
  const backedState = result.getRouterState()!.routes[0]!.state!;
  expect(backedState.routes[backedState.index ?? -1]?.name).toBe('second');
});

it('commits one navigation state update when a stack route tree reloads', () => {
  const routes: Record<string, () => ReactElement | null> = {
    _layout: () => <Stack />,
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
  };
  const result = renderRouter(routes, { initialUrl: '/' });
  const listener = jest.fn();
  const unsubscribe = navigationRef.addListener('state', listener);

  delete routes.second;
  routes.third = () => <Text testID="third">Third</Text>;
  result.rerender(<ExpoRoot context={getMockContext(routes)} location="/" />);

  expect(listener).toHaveBeenCalledTimes(1);
  unsubscribe();
});
