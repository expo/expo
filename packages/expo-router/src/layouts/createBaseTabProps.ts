import type { ParamListBase, TabNavigationState } from '../react-navigation/native';
import type { StandardNavigatorCreatePropsFactoryDeps } from '../standard-navigation/types';

/**
 * Creates the shared props for integrating a tab navigator with Expo Router.
 *
 * @param dependencies The navigation state and dispatch function provided to a `createProps`
 * factory.
 * @returns The shared tab navigator props.
 *
 * @example
 * ```tsx
 * import { createBaseTabProps, TabRouter, unstable_integrateWithRouter } from 'expo-router';
 * import { navigator } from './navigator';
 *
 * export const Tabs = unstable_integrateWithRouter(navigator, TabRouter, {
 *   createProps: createBaseTabProps,
 * });
 * ```
 */
export function createBaseTabProps({
  dispatch,
  isPreloaded,
  isRemovalPrevented,
  state,
}: StandardNavigatorCreatePropsFactoryDeps<TabNavigationState<ParamListBase>>) {
  return {
    isPreloaded,
    isRemovalPrevented,
    routeNames: state.routeNames,
    preload: (name: string) => dispatch({ type: 'PRELOAD', payload: { name } }),
  };
}
