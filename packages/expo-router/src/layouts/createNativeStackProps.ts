import type { NativeStackNavigatorCreateProps } from '../fork/native-stack/createNativeStackNavigator';
import type { ParamListBase, StackNavigationState } from '../react-navigation/native';
import type { StandardNavigatorCreatePropsFactoryDeps } from '../standard-navigation/types';
import { createBaseStackProps } from './stack-utils/createBaseStackProps';

/**
 * Creates the props required to integrate Expo Router's native stack navigator.
 *
 * @param dependencies The navigation state and dispatch functions provided to a `createProps`
 * factory.
 * @returns The native stack navigator props.
 *
 * @example
 * ```tsx
 * import {
 *   createNativeStackProps,
 *   StackRouter,
 *   unstable_integrateWithRouter,
 * } from 'expo-router';
 * import { navigator } from './navigator';
 *
 * export const Stack = unstable_integrateWithRouter(navigator, StackRouter, {
 *   createProps: createNativeStackProps,
 * });
 * ```
 */
export function createNativeStackProps(
  args: StandardNavigatorCreatePropsFactoryDeps<StackNavigationState<ParamListBase>>
): NativeStackNavigatorCreateProps {
  return {
    ...createBaseStackProps(args),
    removeRoutes: (routeNames) =>
      args.dispatch({ type: 'REMOVE_ROUTES', payload: { routeNames } }),
  };
}
