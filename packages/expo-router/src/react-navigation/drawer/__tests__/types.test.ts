import type { ComponentProps } from 'react';

import type { Drawer, DrawerNavigatorProps } from '../../../layouts/Drawer';
import type { DrawerNavigationState, ParamListBase } from '../../native';
import type { DrawerNavigatorContentProps } from '../navigators/createDrawerNavigator';
import type { DrawerNavigationHelpers } from '../types';

type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

type DrawerProps = ComponentProps<typeof Drawer>;

export type _PublicPropsMatchDrawer = Expect<Equal<DrawerNavigatorProps, DrawerProps>>;
export type _DrawerStateIsNotPublic = Expect<
  Equal<'drawerState' extends keyof DrawerProps ? true : false, false>
>;
export type _NavigationIsNotPublic = Expect<
  Equal<'navigation' extends keyof DrawerProps ? true : false, false>
>;
export type _DefaultStatusIsPublic = Expect<
  Equal<DrawerProps['defaultStatus'], 'open' | 'closed' | undefined>
>;
export type _ContentRequiresDrawerState = Expect<
  Equal<DrawerNavigatorContentProps['drawerState'], DrawerNavigationState<ParamListBase>>
>;
export type _ContentRequiresNavigation = Expect<
  Equal<DrawerNavigatorContentProps['navigation'], DrawerNavigationHelpers>
>;

describe('drawer types', () => {
  it('type-checks', () => {
    expect(true).toBe(true);
  });
});
