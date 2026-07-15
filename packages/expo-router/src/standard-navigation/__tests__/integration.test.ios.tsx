import { Fragment } from 'react';
import { Pressable, Text, View } from 'react-native';
import { createStandardNavigator, type NavigatorArgs } from 'standard-navigation';

import { router } from '../../imperative-api';
import type { ParamListBase } from '../../react-navigation/core';
import {
  StackRouter,
  type StackNavigationState,
  type StackRouterOptions,
} from '../../react-navigation/native';
import {
  TabActions,
  TabRouter,
  type TabNavigationState,
  type TabRouterOptions,
} from '../../react-navigation/routers';
import { act, fireEvent, renderRouter, screen } from '../../testing-library';
import { unstable_createStandardRouterNavigator, unstable_integrateWithRouter } from '../index';
import type { NavigatorContentProps } from '../types';

type TestOptions = { title?: string };
type TestEventMap = Record<string, { data: object | undefined; canPreventDefault: boolean }>;

const contentSpy = jest.fn();

function NavigatorContent(args: NavigatorArgs<TestOptions, TestEventMap>) {
  contentSpy(args);
  return (
    <>
      {args.state.routes.map((route) => (
        <Fragment key={route.key}>{args.descriptors[route.key]!.render()}</Fragment>
      ))}
    </>
  );
}

const StandardTabs = unstable_createStandardRouterNavigator<
  TestOptions,
  TabNavigationState<ParamListBase>,
  TestEventMap,
  { tintColor?: string },
  TabRouterOptions
>(NavigatorContent, TabRouter, { useOnlyUserDefinedScreens: true });

// Same navigator, but without restricting to user-defined screens (the default).
const StandardTabsAll = unstable_createStandardRouterNavigator<
  TestOptions,
  TabNavigationState<ParamListBase>,
  TestEventMap,
  object,
  TabRouterOptions
>(NavigatorContent, TabRouter);

const lastArgs = (): NavigatorArgs<TestOptions, TestEventMap> & Record<string, unknown> =>
  contentSpy.mock.calls.at(-1)![0];

const hrefByName = () =>
  Object.fromEntries(lastArgs().state.routes.map((r) => [r.name, r.href] as const));

beforeEach(() => {
  contentSpy.mockClear();
});

describe('unstable_integrateWithRouter / unstable_createStandardRouterNavigator', () => {
  it('renders declared screens and exposes a well-formed state', () => {
    renderRouter({
      _layout: () => (
        <StandardTabs>
          <StandardTabs.Screen name="index" />
          <StandardTabs.Screen name="second" />
        </StandardTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(lastArgs().state.routes.map((r) => r.name)).toEqual(['index', 'second']);
    expect(lastArgs().state.index).toBe(0);
  });

  it('builds an href for every route', () => {
    renderRouter({
      _layout: () => (
        <StandardTabs>
          <StandardTabs.Screen name="index" />
          <StandardTabs.Screen name="second" />
        </StandardTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    expect(hrefByName()).toEqual({ index: '/', second: '/second' });
  });

  it('updates state when navigating imperatively', () => {
    renderRouter({
      _layout: () => (
        <StandardTabs>
          <StandardTabs.Screen name="index" />
          <StandardTabs.Screen name="second" />
        </StandardTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    act(() => router.navigate('/second'));

    expect(lastArgs().state.routes[lastArgs().state.index]!.name).toBe('second');
  });

  it('switches the focused route via actions.navigate', () => {
    renderRouter({
      _layout: () => (
        <StandardTabs>
          <StandardTabs.Screen name="index" />
          <StandardTabs.Screen name="second" />
        </StandardTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    act(() => lastArgs().actions.navigate('second'));

    expect(lastArgs().state.routes[lastArgs().state.index]!.name).toBe('second');
  });

  it('returns to the first tab via actions.back', () => {
    renderRouter({
      _layout: () => (
        <StandardTabs>
          <StandardTabs.Screen name="index" />
          <StandardTabs.Screen name="second" />
        </StandardTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    act(() => lastArgs().actions.navigate('second'));
    expect(lastArgs().state.index).toBe(1);

    act(() => lastArgs().actions.back());

    expect(lastArgs().state.index).toBe(0);
  });

  it('exposes screen options and a render function on each descriptor', () => {
    renderRouter({
      _layout: () => (
        <StandardTabs>
          <StandardTabs.Screen name="index" options={{ title: 'Home' }} />
        </StandardTabs>
      ),
      index: () => <View testID="index" />,
    });

    const key = lastArgs().state.routes[0]!.key;
    expect(lastArgs().descriptors[key]!.options).toMatchObject({ title: 'Home' });
    expect(typeof lastArgs().descriptors[key]!.render).toBe('function');
  });

  it('passes the standard navigator args (state, descriptors, actions, emitter) to NavigatorContent', () => {
    renderRouter({
      _layout: () => (
        <StandardTabs>
          <StandardTabs.Screen name="index" />
        </StandardTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(Object.keys(lastArgs()).sort()).toEqual(['actions', 'descriptors', 'emitter', 'state']);
  });

  it('passes extra navigator props through to NavigatorContent', () => {
    renderRouter({
      _layout: () => (
        <StandardTabs tintColor="rebeccapurple">
          <StandardTabs.Screen name="index" />
        </StandardTabs>
      ),
      index: () => <View testID="index" />,
    });

    expect(lastArgs().tintColor).toBe('rebeccapurple');
  });

  it('respects useOnlyUserDefinedScreens by filtering undeclared routes', () => {
    renderRouter({
      _layout: () => (
        <StandardTabs>
          <StandardTabs.Screen name="index" />
        </StandardTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    expect(lastArgs().state.routes.map((r) => r.name)).toEqual(['index']);
  });

  it('includes undeclared matched routes when useOnlyUserDefinedScreens is false', () => {
    renderRouter({
      _layout: () => (
        <StandardTabsAll>
          <StandardTabsAll.Screen name="index" />
        </StandardTabsAll>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    expect(
      lastArgs()
        .state.routes.map((r) => r.name)
        .sort()
    ).toEqual(['index', 'second']);
  });

  it('keeps Protected screens whose guard is false hidden', () => {
    renderRouter({
      _layout: () => (
        <StandardTabs>
          <StandardTabs.Screen name="index" />
          <StandardTabs.Protected guard={false}>
            <StandardTabs.Screen name="second" />
          </StandardTabs.Protected>
        </StandardTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    const args = lastArgs();
    const second = args.state.routes.find((route) => route.name === 'second')!;

    expect(args.state.routes.map((route) => route.name)).toEqual(['index', 'second']);
    expect(args.descriptors[second.key]!.options).toMatchObject({ hidden: true });
  });

  it('propagates route params into state and href', () => {
    renderRouter(
      {
        _layout: () => (
          <StandardTabs>
            <StandardTabs.Screen name="[id]" />
          </StandardTabs>
        ),
        '[id]': () => <View testID="id" />,
      },
      { initialUrl: '/42' }
    );

    const idRoute = lastArgs().state.routes.find((r) => r.name === '[id]')!;
    expect(idRoute.params).toMatchObject({ id: '42' });
    expect(idRoute.href).toBe('/42');
  });

  it('runs screenListeners (function form) with route + navigation on focus change', () => {
    const focused = jest.fn();
    renderRouter({
      _layout: () => (
        <StandardTabs
          screenListeners={({ route, navigation }) => ({
            focus: () => focused({ name: route.name, hasNavigate: typeof navigation.navigate }),
          })}>
          <StandardTabs.Screen name="index" />
          <StandardTabs.Screen name="second" />
        </StandardTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    act(() => router.navigate('/second'));

    expect(focused).toHaveBeenCalledWith({ name: 'second', hasNavigate: 'function' });
  });

  it('runs screenListeners (object form) on focus change', () => {
    const focused = jest.fn();
    renderRouter({
      _layout: () => (
        <StandardTabs screenListeners={{ focus: () => focused() }}>
          <StandardTabs.Screen name="index" />
          <StandardTabs.Screen name="second" />
        </StandardTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    act(() => router.navigate('/second'));

    expect(focused).toHaveBeenCalled();
  });

  it('passes props derived from state via createProps to NavigatorContent', () => {
    const StandardWithProps = unstable_createStandardRouterNavigator<
      TestOptions,
      TabNavigationState<ParamListBase>,
      TestEventMap,
      object,
      TabRouterOptions,
      { focusedName: string }
    >(NavigatorContent, TabRouter, {
      useOnlyUserDefinedScreens: true,
      createProps: ({ state }) => ({ focusedName: state.routes[state.index]!.name }),
    });

    renderRouter({
      _layout: () => (
        <StandardWithProps>
          <StandardWithProps.Screen name="index" />
          <StandardWithProps.Screen name="second" />
        </StandardWithProps>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    expect(lastArgs().focusedName).toBe('index');

    act(() => router.navigate('/second'));

    expect(lastArgs().focusedName).toBe('second');
  });

  // Covers the `dispatch` path of `createProps` (the part flagged as internal and most likely to
  // break): a prop built from the raw dispatch must actually mutate the navigator state when called.
  it('exposes a working dispatch via createProps to NavigatorContent', () => {
    const StandardWithDispatch = unstable_createStandardRouterNavigator<
      TestOptions,
      TabNavigationState<ParamListBase>,
      TestEventMap,
      object,
      TabRouterOptions,
      { goToSecond: () => void }
    >(NavigatorContent, TabRouter, {
      useOnlyUserDefinedScreens: true,
      createProps: ({ dispatch }) => ({
        goToSecond: () => dispatch(TabActions.jumpTo('second')),
      }),
    });

    renderRouter({
      _layout: () => (
        <StandardWithDispatch>
          <StandardWithDispatch.Screen name="index" />
          <StandardWithDispatch.Screen name="second" />
        </StandardWithDispatch>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    expect(lastArgs().state.index).toBe(0);

    act(() => (lastArgs().goToSecond as () => void)());

    expect(lastArgs().state.index).toBe(1);
    expect(lastArgs().state.routes[lastArgs().state.index]!.name).toBe('second');
  });

  // initialRouteName is a router option, not a NavigatorContent prop: it is destructured out of the
  // props spread so it never reaches the content component (the focused route itself is URL-driven).
  it('does not leak initialRouteName to NavigatorContent', () => {
    renderRouter({
      _layout: () => (
        <StandardTabs initialRouteName="second">
          <StandardTabs.Screen name="index" />
          <StandardTabs.Screen name="second" />
        </StandardTabs>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

    expect(lastArgs().initialRouteName).toBeUndefined();
  });
});

describe('preloaded routes projected through the integration (StackRouter)', () => {
  const StandardStack = unstable_createStandardRouterNavigator<
    TestOptions,
    StackNavigationState<ParamListBase>,
    TestEventMap,
    object,
    StackRouterOptions
  >(NavigatorContent, StackRouter, { useOnlyUserDefinedScreens: true });

  const renderStack = () =>
    renderRouter({
      _layout: () => (
        <StandardStack>
          <StandardStack.Screen name="index" />
          <StandardStack.Screen name="second" />
        </StandardStack>
      ),
      index: () => <View testID="index" />,
      second: () => <View testID="second" />,
    });

  it('projects a preloaded route after the focused index without moving focus', () => {
    renderStack();
    expect(lastArgs().state.routes.map((r) => r.name)).toEqual(['index']);

    act(() => router.prefetch('/second'));

    expect(lastArgs().state.routes.map((r) => r.name)).toEqual(['index', 'second']);
    expect(lastArgs().state.index).toBe(0);
  });

  it('covers the projected preloaded route with a descriptor exposing render + navigation', () => {
    renderStack();
    act(() => router.prefetch('/second'));

    const preloadedKey = lastArgs().state.routes[1]!.key;
    const descriptor = lastArgs().descriptors[preloadedKey]!;
    expect(typeof descriptor.render).toBe('function');
    // The integration forwards the real react-navigation descriptor, so `.navigation` is usable
    // by headers/screens even while the route is only preloaded.
    const withNavigation = descriptor as unknown as { navigation?: { navigate?: unknown } };
    expect(typeof withNavigation.navigation?.navigate).toBe('function');
  });

  it('reuses the preloaded route on navigate instead of duplicating it', () => {
    renderStack();
    act(() => router.prefetch('/second'));
    expect(lastArgs().state.routes.map((r) => r.name)).toEqual(['index', 'second']);

    act(() => router.push('/second'));

    expect(lastArgs().state.routes.map((r) => r.name)).toEqual(['index', 'second']);
    expect(lastArgs().state.index).toBe(1);
  });
});

describe('assertStandardNavigator (via unstable_integrateWithRouter)', () => {
  // Kept in sync with the messages thrown in assertStandardNavigator (index.tsx). The `type` is
  // interpolated via JSON.stringify, so a string becomes `"weird"` and `undefined` stays unquoted.
  const noNavigatorMessage =
    'Could not integrate a standard navigator because no navigator was provided. ' +
    'Pass the object returned by `createStandardNavigator(...)` from the `standard-navigation` package, ' +
    'or use `unstable_createStandardRouterNavigator(NavigatorContent, router)` which creates it for you.';
  const wrongTypeMessage = (type: string) =>
    `Could not integrate a standard navigator because its \`type\` is ${type}, not "standard". ` +
    'This value is likely not a standard-navigation navigator. ' +
    'Create it with `createStandardNavigator(...)` from the `standard-navigation` package, ' +
    'or use `unstable_createStandardRouterNavigator(NavigatorContent, router)`.';
  // Kept in sync with the warning logged in assertStandardNavigator (index.tsx).
  const wrongVersionMessage = (version: number) =>
    `This standard navigator targets the standard-navigation v${version} contract, ` +
    'but this version of expo-router was built against v1. ' +
    'Integration may still work, but if you hit unexpected navigation behavior, ' +
    'align the installed `standard-navigation` version with your expo-router version, ' +
    'or check the standard-navigation release notes for migration steps.';

  it('throws when the navigator is null', () => {
    expect(() => unstable_integrateWithRouter(null as any, TabRouter)).toThrow(
      new Error(noNavigatorMessage)
    );
  });

  it('throws a wrong-type error when required fields are missing', () => {
    // An empty object has an `undefined` type, which fails the `type === "standard"` check first.
    expect(() => unstable_integrateWithRouter({} as any, TabRouter)).toThrow(
      new Error(wrongTypeMessage('undefined'))
    );
  });

  it('throws when the navigator type is not "standard"', () => {
    expect(() =>
      unstable_integrateWithRouter(
        { type: 'weird', version: 1, NavigatorContent: () => null } as any,
        TabRouter
      )
    ).toThrow(new Error(wrongTypeMessage('"weird"')));
  });

  it('warns but does not throw when the navigator version is unsupported', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(() =>
        unstable_integrateWithRouter(
          { type: 'standard', version: 2, NavigatorContent: () => null } as any,
          TabRouter
        )
      ).not.toThrow();
      expect(warn).toHaveBeenCalledWith(wrongVersionMessage(2));
    } finally {
      warn.mockRestore();
    }
  });

  it('warns for a falsy version (0)', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      expect(() =>
        unstable_integrateWithRouter(
          { type: 'standard', version: 0, NavigatorContent: () => null } as any,
          TabRouter
        )
      ).not.toThrow();
      expect(warn).toHaveBeenCalledWith(wrongVersionMessage(0));
    } finally {
      warn.mockRestore();
    }
  });

  it('accepts a navigator produced by the real createStandardNavigator', () => {
    expect(() =>
      unstable_integrateWithRouter(
        createStandardNavigator(() => null),
        TabRouter
      )
    ).not.toThrow();
  });
});

describe('custom-navigators guide example', () => {
  type TabsContentProps = NavigatorContentProps<{ title?: string }>;

  function TabsContent({ state, descriptors, actions }: TabsContentProps) {
    const focusedRoute = state.routes[state.index]!;

    return (
      <View style={{ flex: 1 }}>
        {/* Render the screen for the focused route. */}
        <View style={{ flex: 1 }}>{descriptors[focusedRoute.key]!.render()}</View>

        {/* A simple tab bar. */}
        <View style={{ flexDirection: 'row' }}>
          {state.routes.map((route) => (
            <Pressable
              key={route.key}
              style={{ flex: 1, padding: 16 }}
              onPress={() => actions.navigate(route.name)}>
              <Text>{descriptors[route.key]!.options.title ?? route.name}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  const Tabs = unstable_createStandardRouterNavigator(TabsContent, TabRouter);

  const renderExample = () =>
    renderRouter({
      _layout: () => (
        <Tabs>
          <Tabs.Screen name="index" options={{ title: 'Home' }} />
          <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
        </Tabs>
      ),
      index: () => <View testID="index" />,
      settings: () => <View testID="settings" />,
    });

  it('renders the focused screen and a tab bar with each screen title', () => {
    renderExample();

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen.getByText('Home')).toBeVisible();
    expect(screen.getByText('Settings')).toBeVisible();
  });

  it('navigates to a screen when its tab is pressed', () => {
    renderExample();

    act(() => {
      fireEvent.press(screen.getByText('Settings'));
    });

    expect(screen.getByTestId('settings')).toBeVisible();
  });
});

describe('custom-navigators guide example', () => {
  // Mirrors the `createProps` snippet from the guide (docs/pages/router/advanced/custom-navigators.mdx).
  // The guide dispatches a `PRELOAD` action; this test proves that action actually reaches the
  // TabRouter and preloads the route. The previous `POP_TO_TOP` example was a silent no-op on tabs
  // (only StackRouter handles it), so a copy-paste user got a button that did nothing.
  //
  // `preloadedNames` is derived from the raw `state` — exactly the "router-specific information that
  // is not part of the standard state" that `createProps` exists to expose (TabRouter keeps preloaded
  // routes in `preloadedRouteKeys`, which the standard contract does not project).
  type CreatePropsProps = {
    activeRouteKey: string;
    preload: (name: string) => void;
    preloadedNames: string[];
  };
  type ContentProps = NavigatorContentProps<
    { title?: string },
    Record<string, never>,
    CreatePropsProps
  >;

  const contentSpy = jest.fn<void, [ContentProps]>();
  const lastProps = () => contentSpy.mock.calls.at(-1)![0];

  function TabsContent(props: ContentProps) {
    contentSpy(props);
    const focusedRoute = props.state.routes[props.state.index]!;
    return <View style={{ flex: 1 }}>{props.descriptors[focusedRoute.key]!.render()}</View>;
  }

  const Tabs = unstable_createStandardRouterNavigator<
    { title?: string },
    TabNavigationState<ParamListBase>,
    Record<string, never>,
    object,
    TabRouterOptions,
    CreatePropsProps
  >(TabsContent, TabRouter, {
    useOnlyUserDefinedScreens: true,
    createProps: ({ state, dispatch }) => ({
      activeRouteKey: state.routes[state.index]!.key,
      preload: (name: string) => dispatch({ type: 'PRELOAD', payload: { name } }),
      preloadedNames: state.preloadedRouteKeys
        .map((key) => state.routes.find((route) => route.key === key)?.name)
        .filter((name): name is string => name !== undefined),
    }),
  });

  const renderExample = () =>
    renderRouter({
      _layout: () => (
        <Tabs>
          <Tabs.Screen name="index" options={{ title: 'Home' }} />
          <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
        </Tabs>
      ),
      index: () => <View testID="index" />,
      settings: () => <View testID="settings" />,
    });

  beforeEach(() => {
    contentSpy.mockClear();
  });

  it('exposes the focused route key via createProps', () => {
    renderExample();
    expect(lastProps().activeRouteKey).toBe(lastProps().state.routes[0]!.key);
  });

  it('preloads a route via the createProps PRELOAD dispatch without moving focus', () => {
    renderExample();
    expect(lastProps().preloadedNames).toEqual([]);

    act(() => lastProps().preload('settings'));

    // The action reached the TabRouter: `settings` is now preloaded, and focus stayed on `index`.
    expect(lastProps().preloadedNames).toEqual(['settings']);
    expect(lastProps().state.index).toBe(0);
    expect(lastProps().state.routes[lastProps().state.index]!.name).toBe('index');
  });
});
