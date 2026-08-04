import type { JSTopTabsProps } from '../../../layouts/TopTabs';
import type { MaterialTopTabNavigatorContentProps } from '../navigators/createMaterialTopTabNavigator';
import type {
  MaterialTopTabBarProps,
  MaterialTopTabNavigationConfig,
  MaterialTopTabNavigationOptions,
  MaterialTopTabViewState,
} from '../types';

type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type IsAny<T> = 0 extends 1 & T ? true : false;

type IndicatorProps = Parameters<
  NonNullable<MaterialTopTabNavigationOptions['tabBarIndicator']>
>[0];

export type _PublicPropsIncludeTabBar = Expect<
  'tabBar' extends keyof JSTopTabsProps ? true : false
>;
export type _NavigationConfigIsNotAny = Expect<Equal<IsAny<MaterialTopTabNavigationConfig>, false>>;
export type _TabBarPropsAreNotAny = Expect<Equal<IsAny<MaterialTopTabBarProps>, false>>;
export type _TabBarPropsExcludeNavigation = Expect<
  'navigation' extends keyof MaterialTopTabBarProps ? false : true
>;
export type _IndicatorUsesTopTabViewState = Expect<
  Equal<IndicatorProps['state'], MaterialTopTabViewState>
>;
export type _ContentRequiresPreloadedRouteKeys = Expect<
  Equal<MaterialTopTabNavigatorContentProps['preloadedRouteKeys'], string[]>
>;

describe('material top tabs types', () => {
  it('type-checks', () => {
    expect(true).toBe(true);
  });
});
