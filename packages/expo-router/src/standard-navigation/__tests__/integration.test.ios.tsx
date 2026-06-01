import { Fragment } from 'react';
import { View } from 'react-native';
import { createStandardNavigator, type NavigatorArgs } from 'standard-navigation';

import { router } from '../../imperative-api';
import type { ParamListBase } from '../../react-navigation/core';
import {
  TabActions,
  TabRouter,
  type TabNavigationState,
  type TabRouterOptions,
} from '../../react-navigation/routers';
import { act, renderRouter, screen } from '../../testing-library';
import { unstable_createStandardRouterNavigator, unstable_integrateWithRouter } from '../index';

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

  it('filters out Protected screens whose guard is false', () => {
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

    expect(lastArgs().state.routes.map((r) => r.name)).toEqual(['index']);
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
      { focusedName?: string },
      TabRouterOptions
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
      { goToSecond?: () => void },
      TabRouterOptions
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
  const wrongVersionMessage = (version: number) =>
    `Could not integrate a standard navigator because it targets the standard-navigation v${version} contract, ` +
    'but this version of expo-router only supports v1. ' +
    'Align the installed `standard-navigation` version with your expo-router version, ' +
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

  it('throws when the navigator version is unsupported', () => {
    expect(() =>
      unstable_integrateWithRouter(
        { type: 'standard', version: 2, NavigatorContent: () => null } as any,
        TabRouter
      )
    ).toThrow(new Error(wrongVersionMessage(2)));
  });

  it('throws a version error for a falsy version (0)', () => {
    expect(() =>
      unstable_integrateWithRouter(
        { type: 'standard', version: 0, NavigatorContent: () => null } as any,
        TabRouter
      )
    ).toThrow(new Error(wrongVersionMessage(0)));
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
