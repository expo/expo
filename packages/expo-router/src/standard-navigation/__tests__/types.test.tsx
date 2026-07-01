/* eslint-disable @typescript-eslint/no-unused-vars */
import { type ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { createStandardNavigator, type NavigatorArgs } from 'standard-navigation';

import type { CommonNavigationAction, ParamListBase } from '../../react-navigation/core';
import {
  TabRouter,
  type TabNavigationState,
  type TabRouterOptions,
} from '../../react-navigation/routers';
import type { GoBackAction, NavigateAction } from '../../react-navigation/routers/CommonActions';
import { unstable_createStandardRouterNavigator } from '../index';
import type { NavigatorContentProps, StandardNavigationAction } from '../types';

// Type-equality helpers
type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

type Opts = { title?: string };
type EventMap = { tabPress: { data: undefined; canPreventDefault: true } };

function Content(_args: NavigatorArgs<Opts, EventMap>) {
  return null;
}

// ---------------------------------------------------------------------------
// StandardNavigationAction
// ---------------------------------------------------------------------------

export type _ActionIsNavigateOrGoBack = Expect<
  Equal<StandardNavigationAction, NavigateAction | GoBackAction>
>;

// StandardNavigationAction must remain a subset of the common action union so it can be dispatched
// through any RouterFactory (e.g. TabRouter's `TabActionType | CommonNavigationAction`).
export type _ActionAssignableToCommon = Expect<
  StandardNavigationAction extends CommonNavigationAction ? true : false
>;

export const _validActions: StandardNavigationAction[] = [
  { type: 'GO_BACK' },
  { type: 'NAVIGATE', payload: { name: 'home' } },
];

// @ts-expect-error RESET is not part of StandardNavigationAction.
export const _invalidAction: StandardNavigationAction = { type: 'RESET', payload: { routes: [] } };

// ---------------------------------------------------------------------------
// Returned component exposes typed .Screen / .Protected
// ---------------------------------------------------------------------------

const Nav = unstable_createStandardRouterNavigator<
  Opts,
  TabNavigationState<ParamListBase>,
  EventMap,
  object,
  TabRouterOptions
>(Content, TabRouter);

export type _HasScreen = Expect<Equal<typeof Nav extends { Screen: unknown } ? true : false, true>>;
export type _HasProtected = Expect<
  Equal<typeof Nav extends { Protected: unknown } ? true : false, true>
>;

// ---------------------------------------------------------------------------
// screenListeners / screenOptions function form, derived from the navigator's own props
// ---------------------------------------------------------------------------

type Props = ComponentProps<typeof Nav>;

type ListenersFn = Extract<Props['screenListeners'], (...args: any) => any>;
type OptionsFn = Extract<Props['screenOptions'], (...args: any) => any>;

export const _listeners: ListenersFn = ({ route, navigation }) => {
  navigation.navigate();
  // @ts-expect-error the route passed to screenListeners must not expose `href`.
  route.href;
  return { focus: () => route.name };
};

export const _options: OptionsFn = ({ route, theme }) => {
  // @ts-expect-error the route passed to screenOptions must not expose `href`.
  route.href;
  return { title: `${route.name}-${theme.dark}` };
};

// ---------------------------------------------------------------------------
// CreateProps generic: content-only props injected by `createProps` are separate from the
// navigator-element props, and `createProps` is required once they're declared.
// ---------------------------------------------------------------------------

type NavProps = { tintColor?: string };
type Injected = { routeNames: string[]; preload: (name: string) => void };

const SplitNav = unstable_createStandardRouterNavigator<
  Opts,
  TabNavigationState<ParamListBase>,
  EventMap,
  NavProps,
  TabRouterOptions,
  Injected
>(
  (_args: NavigatorContentProps<Opts, EventMap, NavProps & Injected>) => null,
  TabRouter,
  { createProps: () => ({ routeNames: [], preload: () => {} }) }
);

type SplitElementProps = ComponentProps<typeof SplitNav>;

// NavigatorProps reach the navigator element...
export type _ElementHasNavProp = Expect<
  Equal<'tintColor' extends keyof SplitElementProps ? true : false, true>
>;
// ...but the createProps-injected props do NOT.
export type _ElementLacksInjectedRoutes = Expect<
  Equal<'routeNames' extends keyof SplitElementProps ? true : false, false>
>;
export type _ElementLacksInjectedPreload = Expect<
  Equal<'preload' extends keyof SplitElementProps ? true : false, false>
>;

// `createProps` is required when `CreateProps` is non-empty: an `options` object without it errors.
unstable_createStandardRouterNavigator<
  Opts,
  TabNavigationState<ParamListBase>,
  EventMap,
  NavProps,
  TabRouterOptions,
  Injected
>(
  (_args: NavigatorContentProps<Opts, EventMap, NavProps & Injected>) => null,
  TabRouter,
  // @ts-expect-error `createProps` is required because `Injected` is non-empty.
  { useOnlyUserDefinedScreens: true }
);

// `createProps` stays optional when there are no extra `CreateProps` (default generic).
unstable_createStandardRouterNavigator<
  Opts,
  TabNavigationState<ParamListBase>,
  EventMap,
  NavProps,
  TabRouterOptions
>((_args: NavigatorContentProps<Opts, EventMap, NavProps>) => null, TabRouter);

// ---------------------------------------------------------------------------
// The exact example from the "Custom navigators" guide
// (docs/pages/router/advanced/custom-navigators.mdx) must type-check, so the
// snippet users copy keeps compiling.
// ---------------------------------------------------------------------------

// "Create a navigator in your app" — `EventMap` is inferred without explicit type arguments.
{
  type TabsContentProps = NavigatorContentProps<{ title?: string }>;

  const TabsContent = ({ state, descriptors, actions }: TabsContentProps) => {
    const focusedRoute = state.routes[state.index]!;

    return (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>{descriptors[focusedRoute.key]!.render()}</View>
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
  };

  // eslint-disable-next-line no-unused-expressions
  unstable_createStandardRouterNavigator(TabsContent, TabRouter);
}

// "Typed events" — the event map is inferred from the component and `emitter.emit` is typed
// against it (unknown event names and mismatched payloads are rejected).
{
  type TabsContentProps = NavigatorContentProps<
    { title?: string },
    { tabPress: { data: undefined; canPreventDefault: true } }
  >;

  const TabsContent = ({ emitter }: TabsContentProps) => {
    emitter.emit({ type: 'tabPress', canPreventDefault: true });
    // @ts-expect-error `nope` is not a declared event.
    emitter.emit({ type: 'nope' });
    return null;
  };

  // eslint-disable-next-line no-unused-expressions
  unstable_createStandardRouterNavigator(TabsContent, TabRouter);
}

// "Options" — the optional third argument type-checks, and `createProps` may dispatch a `PRELOAD`
// action against the raw router `dispatch` (the guide's `createProps` example). `POP_TO_TOP` would
// be a no-op on a TabRouter, so the guide uses `PRELOAD`.
{
  type TabsContentProps = NavigatorContentProps<{ title?: string }>;

  const TabsContent = ({ state, descriptors }: TabsContentProps) => {
    const focusedRoute = state.routes[state.index]!;
    return <View style={{ flex: 1 }}>{descriptors[focusedRoute.key]!.render()}</View>;
  };

  // eslint-disable-next-line no-unused-expressions
  unstable_createStandardRouterNavigator(TabsContent, TabRouter, {
    useOnlyUserDefinedScreens: true,
    createProps: ({ state, dispatch }) => ({
      activeRouteKey: state.routes[state.index]!.key,
      preload: (name: string) => dispatch({ type: 'PRELOAD', payload: { name } }),
    }),
  });
}

// "Library entry points" — a framework-agnostic navigator created directly with
// `createStandardNavigator`, declaring a real event map (the guide's library-author example).
{
  type TabsContentProps = NavigatorContentProps<
    { title?: string },
    { tabPress: { data: undefined; canPreventDefault: true } }
  >;

  const TabsContent = ({ emitter }: TabsContentProps) => {
    emitter.emit({ type: 'tabPress', canPreventDefault: true });
    return null;
  };

  // eslint-disable-next-line no-unused-expressions
  createStandardNavigator<
    { title?: string },
    { tabPress: { data: undefined; canPreventDefault: true } }
  >(TabsContent);
}

describe('standard-navigation types', () => {
  it('type-checks via pnpm test:types', () => {
    expect(typeof unstable_createStandardRouterNavigator).toBe('function');
  });
});
