import type { ComponentProps } from 'react';

import type { JSTabsProps, Tabs, TabsScreenOptions } from '../../../layouts/Tabs';
import type { DescriptorRouteProp, ParamListBase, RouteProp } from '../../native';
import type { BottomTabNavigatorContentProps } from '../navigators/createBottomTabNavigator';
import type { BottomTabOptionsArgs } from '../types';

type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

type TabsProps = ComponentProps<typeof Tabs>;

export type _OptionsRouteIsDescriptorRoute = Expect<
  Equal<BottomTabOptionsArgs<ParamListBase>['route'], DescriptorRouteProp<ParamListBase>>
>;
export type _OptionsRouteKeyMayBeUndefined = Expect<
  Equal<BottomTabOptionsArgs<ParamListBase>['route']['key'], string | undefined>
>;
export type _RoutePropIsDescriptorRoute = Expect<
  RouteProp<ParamListBase> extends DescriptorRouteProp<ParamListBase> ? true : false
>;
export type _PublicPropsMatchTabs = Expect<Equal<JSTabsProps, TabsProps>>;

// The props injected by `createProps` reach the content component but never the element.
export type _RouteNamesIsNotPublic = Expect<
  Equal<'routeNames' extends keyof TabsProps ? true : false, false>
>;
export type _PreloadedRouteKeysIsNotPublic = Expect<
  Equal<'preloadedRouteKeys' extends keyof TabsProps ? true : false, false>
>;
export type _PopNestedStackToTopIsNotPublic = Expect<
  Equal<'popNestedStackToTop' extends keyof TabsProps ? true : false, false>
>;
export type _ContentRequiresPreloadedRouteKeys = Expect<
  Equal<BottomTabNavigatorContentProps['preloadedRouteKeys'], string[]>
>;
export type _ContentRequiresRouteNames = Expect<
  Equal<BottomTabNavigatorContentProps['routeNames'], string[]>
>;
export type _ContentRequiresPopNestedStackToTop = Expect<
  Equal<BottomTabNavigatorContentProps['popNestedStackToTop'], (routeKey: string) => void>
>;

// The tab bar config stays a public navigator prop.
export type _DetachInactiveScreensIsPublic = Expect<
  Equal<TabsProps['detachInactiveScreens'], boolean | undefined>
>;

export const _hiddenTab: TabsScreenOptions = { href: null };
export const _explicitlyHiddenTab: TabsScreenOptions = { hidden: true };
export const _linkedTab: TabsScreenOptions = { href: '/settings', title: 'Settings' };

describe('bottom tabs types', () => {
  it('type-checks', () => {
    expect(true).toBe(true);
  });
});
