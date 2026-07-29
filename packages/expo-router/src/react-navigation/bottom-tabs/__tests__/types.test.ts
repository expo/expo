import type { ComponentProps } from 'react';

import type { BottomTabNavigatorProps, Tabs } from '../../../layouts/Tabs';
import type { BottomTabNavigatorContentProps } from '../navigators/createBottomTabNavigator';

type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

type TabsProps = ComponentProps<typeof Tabs>;

export type _PublicPropsMatchTabs = Expect<Equal<BottomTabNavigatorProps, TabsProps>>;

// The props injected by `createProps` reach the content component but never the element.
export type _PreloadedRouteKeysIsNotPublic = Expect<
  Equal<'preloadedRouteKeys' extends keyof TabsProps ? true : false, false>
>;
export type _PopNestedStackToTopIsNotPublic = Expect<
  Equal<'popNestedStackToTop' extends keyof TabsProps ? true : false, false>
>;
export type _ContentRequiresPreloadedRouteKeys = Expect<
  Equal<BottomTabNavigatorContentProps['preloadedRouteKeys'], string[]>
>;
export type _ContentRequiresPopNestedStackToTop = Expect<
  Equal<BottomTabNavigatorContentProps['popNestedStackToTop'], (routeKey: string) => void>
>;

// The tab bar config stays a public navigator prop.
export type _DetachInactiveScreensIsPublic = Expect<
  Equal<TabsProps['detachInactiveScreens'], boolean | undefined>
>;

// `href` is a screen option of the `Tabs` layout: a link target, or `null` to hide the tab.
type TabsScreenOptions = Exclude<
  ComponentProps<typeof Tabs.Screen>['options'],
  ((...args: any) => any) | undefined
>;

export const _hiddenTab: TabsScreenOptions = { href: null };
export const _linkedTab: TabsScreenOptions = { href: '/settings', title: 'Settings' };

describe('bottom tabs types', () => {
  it('type-checks', () => {
    expect(true).toBe(true);
  });
});
