import { jest } from '@jest/globals';
import { act, screen } from '@testing-library/react-native';
import {
  Suspense,
  startTransition,
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Text } from 'react-native';

import { ExpoRoot } from '../ExpoRoot';
import { navigationRef } from '../global-state/navigationRef';
import {
  RouterRegistrySettersContext,
  type RouterRegistrySetters,
} from '../global-state/routerRegistry';
import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import TopTabs from '../layouts/TopTabs';
import { unstable_navigationEvents } from '../navigationEvents';
import { useFocusEffect, useNavigation } from '../react-navigation/core';
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
  expect(result.getRouterState()!.routes[0]!.state!.routes[0]!.state?.routeNames).toStrictEqual([
    'index',
  ]);
});

it('removes nested state when a layout becomes a leaf with the same name', () => {
  const routes: Record<string, () => ReactElement | null> = {
    _layout: () => <Stack />,
    index: () => <Text testID="index">Index</Text>,
    'second/_layout': () => <Stack />,
    'second/index': () => <Text testID="second-index">Second index</Text>,
  };

  const result = renderRouter(routes, { initialUrl: '/' });
  const initialState = result.getRouterState()!.routes[0]!.state!;
  const indexKey = initialState.routes[0]!.key;
  act(() => router.push('/second'));
  expect(screen.getByTestId('second-index')).toBeVisible();

  delete routes['second/_layout'];
  delete routes['second/index'];
  routes.second = () => <Text testID="second-leaf">Second leaf</Text>;

  result.rerender(<ExpoRoot context={getMockContext(routes)} location="/" />);

  const state = result.getRouterState()!.routes[0]!.state!;
  expect(screen.getByTestId('second-leaf')).toBeVisible();
  expect(state.routeNames).toStrictEqual(['index', 'second']);
  expect(state.routes[0]!.key).toBe(indexKey);
  expect(state.routes[state.index!]!.name).toBe('second');
  expect(state.routes[state.index!]!.state).toBeUndefined();
  act(() => router.back());
  expect(screen.getByTestId('index')).toBeVisible();
});

it('keeps canonical tab route names when screens are declared in another order', () => {
  const routes = {
    _layout: () => (
      <Tabs>
        <Tabs.Screen name="second" />
        <Tabs.Screen name="index" />
      </Tabs>
    ),
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
  };

  const result = renderRouter(routes, { initialUrl: '/' });
  const state = result.getRouterState()!.routes[0]!.state!;
  expect(screen.getByTestId('index')).toBeVisible();
  expect(state.routeNames).toStrictEqual(['index', 'second']);
  expect(state.routes[state.index!]!.name).toBe('index');

  act(() => router.navigate('/second'));
  expect(screen.getByTestId('second')).toBeVisible();
  expect(result.getRouterState()!.routes[0]!.state!.routeNames).toStrictEqual(['index', 'second']);
});

it('keeps the focused tab and route keys when declared screen order changes', () => {
  let reordered = false;
  const routes = {
    _layout: () => (
      <Tabs backBehavior="order">
        {reordered ? <Tabs.Screen name="third" /> : <Tabs.Screen name="index" />}
        <Tabs.Screen name="second" />
        {reordered ? <Tabs.Screen name="index" /> : <Tabs.Screen name="third" />}
      </Tabs>
    ),
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
    third: () => <Text testID="third">Third</Text>,
  };

  const result = renderRouter(routes, { initialUrl: '/' });
  act(() => router.navigate('/second'));
  const before = result.getRouterState()!.routes[0]!.state!;
  const keys = Object.fromEntries(before.routes.map((route) => [route.name, route.key]));

  reordered = true;
  result.rerender(<ExpoRoot context={getMockContext(routes)} location="/" />);

  const after = result.getRouterState()!.routes[0]!.state!;
  expect(screen.getByTestId('second')).toBeVisible();
  expect(after.routes[after.index!]!.key).toBe(before.routes[before.index!]!.key);
  expect(Object.fromEntries(after.routes.map((route) => [route.name, route.key]))).toStrictEqual(
    keys
  );

  act(() => router.back());
  expect(screen.getByTestId('third')).toBeVisible();
  const backedState = result.getRouterState()!.routes[0]!.state!;
  expect(backedState.routes[backedState.index!]!.name).toBe('third');
});

it('goes back through a child after tab reordering changes its parent focus', () => {
  let reordered = false;
  const routes = {
    _layout: () => (
      <Tabs backBehavior="order">
        {reordered ? <Tabs.Screen name="third" /> : <Tabs.Screen name="index" />}
        {reordered ? <Tabs.Screen name="index" /> : <Tabs.Screen name="second" />}
        {reordered ? <Tabs.Screen name="second" /> : <Tabs.Screen name="third" />}
      </Tabs>
    ),
    index: () => <Text testID="index">Index</Text>,
    'second/_layout': () => <Stack />,
    'second/index': () => <Text testID="second-index">Second index</Text>,
    'second/details': () => <Text testID="second-details">Second details</Text>,
    third: () => <Text testID="third">Third</Text>,
  };

  const result = renderRouter(routes, { initialUrl: '/' });
  const initialState = result.getRouterState()!.routes[0]!.state!;
  const indexKey = initialState.routes[initialState.index!]!.key;

  reordered = true;
  result.rerender(<ExpoRoot context={getMockContext(routes)} location="/" />);
  act(() => router.navigate('/second'));
  expect(screen.getByTestId('second-index')).toBeVisible();
  act(() => router.push('/second/details'));
  expect(screen.getByTestId('second-details')).toBeVisible();
  expect(result.getRouterState()!.routes[0]!.state!.routes[1]!.state?.routeNames).toStrictEqual([
    'index',
    'details',
  ]);

  act(() => router.back());
  expect(screen.getByTestId('second-index')).toBeVisible();
  act(() => router.back());
  expect(screen.getByTestId('index')).toBeVisible();
  const state = result.getRouterState()!.routes[0]!.state!;
  expect(state.routes[state.index!]!.key).toBe(indexKey);
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

it('keeps Protected guards registered and redirects a focused guarded screen', () => {
  let setAllowed: (allowed: boolean) => void = () => {};
  const Layout = () => {
    const [allowed, update] = useState(true);
    setAllowed = update;
    return (
      <Stack>
        <Stack.Screen name="index" />
        <Stack.Protected guard={allowed}>
          <Stack.Screen name="second" />
        </Stack.Protected>
      </Stack>
    );
  };
  const result = renderRouter(
    {
      _layout: Layout,
      index: () => <Text testID="index">Index</Text>,
      second: () => <Text testID="second">Second</Text>,
    },
    { initialUrl: '/second' }
  );
  expect(screen.getByTestId('second')).toBeVisible();
  const names = result.getRouterState()!.routes[0]!.state!.routeNames;
  act(() => setAllowed(false));
  expect(screen).toHavePathname('/');
  expect(screen.getByTestId('index')).toBeVisible();
  expect(result.getRouterState()!.routes[0]!.state!.routeNames).toEqual(names);
});

it('delivers one diagnostic removal event after HMR without dispatching navigation', () => {
  const removed = jest.fn();
  const prevented = jest.fn();
  const rootChanged = jest.fn();
  const emit = jest.spyOn(unstable_navigationEvents, 'emit');
  function Second() {
    const navigation = useNavigation();
    usePreventRemove(true, prevented);
    useEffect(() => navigation.addListener('removed', removed), [navigation]);
    return <Text testID="second">Second</Text>;
  }
  const routes: Record<string, () => ReactElement | null> = {
    _layout: () => <Stack />,
    index: () => <Text testID="index">Index</Text>,
    second: Second,
  };
  const result = renderRouter(routes, { initialUrl: '/second' });
  const unsubscribe = navigationRef.addListener('state', rootChanged);
  emit.mockClear();
  delete routes.second;
  result.rerender(<ExpoRoot context={getMockContext(routes)} location="/second" />);
  expect(screen).toHavePathname('/');
  expect(screen.getByTestId('index')).toBeVisible();
  expect(removed).toHaveBeenCalledTimes(1);
  expect(removed).toHaveBeenCalledWith(
    expect.objectContaining({ data: { action: { type: 'HMR_CONFIG_CHANGED' } } })
  );
  expect(prevented).not.toHaveBeenCalled();
  expect(rootChanged).toHaveBeenCalled();
  expect(emit.mock.calls.filter(([type]) => type === 'actionDispatched')).toHaveLength(0);
  result.rerender(<ExpoRoot context={getMockContext(routes)} location="/second" />);
  expect(removed).toHaveBeenCalledTimes(1);
  unsubscribe();
  emit.mockRestore();
});

it('adopts new constructor options on an HMR remount with changed membership', () => {
  let changed = false;
  const Layout = () => (
    <Tabs
      key={changed ? 'changed' : 'initial'}
      backBehavior={changed ? 'initialRoute' : 'firstRoute'}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="second" />
      <Tabs.Screen name="third" />
      {changed ? <Tabs.Screen name="fourth" /> : null}
    </Tabs>
  );
  const routes: import('../testing-library/context-stubs').MemoryContext = {
    _layout: { default: Layout, unstable_settings: { initialRouteName: 'index' } },
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
    third: () => <Text testID="third">Third</Text>,
  };
  const result = renderRouter(routes, { initialUrl: '/' });
  act(() => router.navigate('/third'));
  const before = result.getRouterState()!.routes[0]!.state!;
  const focused = before.routes[before.index!]!.key;
  changed = true;
  routes._layout = { default: Layout, unstable_settings: { initialRouteName: 'second' } };
  routes.fourth = () => <Text>Fourth</Text>;
  result.rerender(<ExpoRoot context={getMockContext(routes)} location="/" />);
  const after = result.getRouterState()!.routes[0]!.state!;
  expect(after.routes[after.index!]!.key).toBe(focused);
  expect(after.routeNames).toContain('fourth');
  act(() => router.back());
  const backed = result.getRouterState()!.routes[0]!.state!;
  expect(backed.routes[backed.index!]!.name).toBe('second');
  expect(screen.getByTestId('second')).toBeVisible();
});

it('reports canGoBack using current declared order without changing live history', () => {
  let reversed = false;
  const routes = {
    _layout: () => (
      <Tabs backBehavior="order">
        <Tabs.Screen name={reversed ? 'second' : 'index'} />
        <Tabs.Screen name={reversed ? 'index' : 'second'} />
      </Tabs>
    ),
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
  };
  const result = renderRouter(routes, { initialUrl: '/' });
  act(() => router.navigate('/second'));
  expect(router.canGoBack()).toBe(true);
  const before = result.getRouterState();
  reversed = true;
  result.rerender(<ExpoRoot context={getMockContext(routes)} location="/" />);
  expect(result.getRouterState()).toBe(before);
  expect(router.canGoBack()).toBe(false);
  expect(router.canGoBack()).toBe(false);
  expect(result.getRouterState()).toBe(before);
  reversed = false;
  result.rerender(<ExpoRoot context={getMockContext(routes)} location="/" />);
  expect(router.canGoBack()).toBe(true);
  expect(result.getRouterState()).toBe(before);
});

it('keeps committed order and REPLACE history when a declaration render is abandoned', async () => {
  const orderA = ['index', 'second', 'third'];
  const orderB = ['second', 'index', 'third'];
  const pending = new Promise<void>(() => {});
  const attemptedOrders: string[][] = [];
  const committedOrders: string[][] = [];
  let setOrder!: (order: string[]) => void;
  let registry!: RouterRegistrySetters;

  function OrderGate({ order, children }: { order: string[]; children: ReactNode }) {
    attemptedOrders.push(order);
    useLayoutEffect(() => {
      committedOrders.push(order);
    }, [order]);
    if (order === orderB) {
      throw pending;
    }
    return children;
  }

  function Layout() {
    const [order, updateOrder] = useState(orderA);
    setOrder = updateOrder;
    registry = use(RouterRegistrySettersContext)!;
    return (
      <Suspense fallback={<Text testID="order-fallback">Loading</Text>}>
        <Tabs
          backBehavior="order"
          layout={({ children }) => <OrderGate order={order}>{children}</OrderGate>}>
          {order.map((name) => (
            <Tabs.Screen key={name} name={name} />
          ))}
        </Tabs>
      </Suspense>
    );
  }

  renderRouter({
    _layout: Layout,
    index: () => <Text testID="index">Index</Text>,
    second: () => <Text testID="second">Second</Text>,
    third: () => <Text testID="third">Third</Text>,
  });
  act(() => router.navigate('/second'));
  act(() => router.replace('/third'));
  const before = navigationRef.getRootState();
  const tabsBefore = before.routes[0]!.state!;
  const historyBefore = tabsBefore.history;
  const canonicalNames = [...tabsBefore.routeNames!];
  expect(historyBefore).toEqual([
    { type: 'route', key: tabsBefore.routes.find((route) => route.name === 'index')!.key },
    { type: 'route', key: tabsBefore.routes.find((route) => route.name === 'third')!.key },
  ]);
  const register = jest.spyOn(registry, 'register');
  try {
    await act(async () => startTransition(() => setOrder(orderB)));
    expect(attemptedOrders).toContain(orderB);
    expect(committedOrders).not.toContain(orderB);
    expect(register).not.toHaveBeenCalled();
    expect(screen.queryByTestId('order-fallback')).toBeNull();
    expect(screen.getByTestId('third')).toBeVisible();
    expect(navigationRef.getRootState()).toBe(before);
    expect(tabsBefore.routeNames).toEqual(canonicalNames);
    expect(tabsBefore.history).toBe(historyBefore);

    // Dispatch while B is pending: the mounted builder must still use committed A.
    act(() => router.setParams({ retained: 'yes' }));
    const updated = navigationRef.getRootState().routes[0]!.state!;
    expect(updated.history).toEqual([
      historyBefore![0],
      {
        type: 'route',
        key: tabsBefore.routes.find((route) => route.name === 'third')!.key,
        params: { retained: 'yes' },
      },
    ]);
    expect(updated.routeNames).toEqual(canonicalNames);
    expect(committedOrders).not.toContain(orderB);
    expect(
      register.mock.calls.every(
        ([, entry]) =>
          !entry.declaredRouteNames || entry.declaredRouteNames.join() === orderA.join()
      )
    ).toBe(true);

    await act(async () => setOrder(orderA));
    act(() => router.back());
    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen).toHavePathname('/');
    expect(router.canGoBack()).toBe(false);
    const after = navigationRef.getRootState().routes[0]!.state!;
    expect(after.history).toEqual([historyBefore![0]]);
    expect(after.routeNames).toEqual(canonicalNames);
    expect(committedOrders).not.toContain(orderB);
  } finally {
    register.mockRestore();
  }
});

it('focuses the parent route for a targeted unsupported child navigation', () => {
  renderRouter({
    _layout: () => (
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" />
      </Tabs>
    ),
    index: () => <Text testID="index">Index</Text>,
    'second/_layout': () => <Stack />,
    'second/index': () => <Text testID="second">Second</Text>,
  });
  act(() => router.navigate('/second'));
  act(() => router.navigate('/'));
  const tabs = navigationRef.getRootState().routes[0]!.state!;
  const child = tabs.routes.find((route) => route.name === 'second')!.state!;
  expect(screen.getByTestId('index')).toBeVisible();
  act(() =>
    navigationRef.dispatch({ type: 'NAVIGATE', target: child.key, payload: { name: 'missing' } })
  );
  expect(screen.getByTestId('second')).toBeVisible();
  expect(screen).toHavePathname('/second');
  const next = navigationRef.getRootState().routes[0]!.state!;
  expect(next.routes[next.index!]!.state).toBe(child);
});
