import {
  type TabActionHelpers,
  type TabActionType,
  type TabNavigationState,
  TabRouter,
  type TabRouterOptions,
} from './TabRouter';
import type { CommonNavigationAction, InternalRouter, ParamListBase } from './types';

export type DrawerStatus = 'open' | 'closed';

export type DrawerActionType = TabActionType;

export type DrawerRouterOptions = TabRouterOptions & {
  defaultStatus?: DrawerStatus;
};

// Drawer state has the same shape as tab state. The drawer's open/closed status is owned by the
// drawer navigator's local React state, not stored in navigation state.
export type DrawerNavigationState<ParamList extends ParamListBase> = TabNavigationState<ParamList>;

export type DrawerActionHelpers<ParamList extends ParamListBase> = TabActionHelpers<ParamList>;

/**
 * DrawerRouter is considered internal implementation and its behavior may change without a notice between expo-router's version.
 *
 * Keys are kind-free (derived structurally from the parent route key), so the drawer needs no
 * behavior of its own — it is exactly a TabRouter.
 */
export function DrawerRouter(
  options: DrawerRouterOptions
): InternalRouter<DrawerNavigationState<ParamListBase>, DrawerActionType | CommonNavigationAction> {
  return TabRouter(options) as unknown as InternalRouter<
    DrawerNavigationState<ParamListBase>,
    DrawerActionType | CommonNavigationAction
  >;
}
