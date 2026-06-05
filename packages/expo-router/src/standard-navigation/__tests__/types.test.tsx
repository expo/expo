/* eslint-disable @typescript-eslint/no-unused-vars */
import { type ComponentProps } from 'react';
import { type NavigatorArgs } from 'standard-navigation';

import type { CommonNavigationAction, ParamListBase } from '../../react-navigation/core';
import {
  TabRouter,
  type TabNavigationState,
  type TabRouterOptions,
} from '../../react-navigation/routers';
import type { GoBackAction, NavigateAction } from '../../react-navigation/routers/CommonActions';
import { unstable_createStandardRouterNavigator } from '../index';
import type { StandardNavigationAction } from '../types';

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

describe('standard-navigation types', () => {
  it('type-checks via pnpm test:types', () => {
    expect(typeof unstable_createStandardRouterNavigator).toBe('function');
  });
});
