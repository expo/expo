import type { ParamListBase, StackNavigationState } from '../../react-navigation/native';
import { makePopAction } from '../../react-navigation/native-stack/utils/makePopAction';
import { subscribePopToTopOnParentTabPress } from '../../standard-navigation/subscribePopToTopOnParentTabPress';
import type { StandardNavigatorCreatePropsFactoryDeps } from '../../standard-navigation/types';

/**
 * Creates the shared props for integrating a stack navigator with Expo Router.
 *
 * @param dependencies The navigation state and dispatch functions provided to a `createProps`
 * factory.
 * @returns The shared stack navigator props.
 *
 * @example
 * ```tsx
 * import { createBaseStackProps, StackRouter, unstable_integrateWithRouter } from 'expo-router';
 * import { navigator } from './navigator';
 *
 * export const Stack = unstable_integrateWithRouter(navigator, StackRouter, {
 *   createProps: createBaseStackProps,
 * });
 * ```
 */
export function createBaseStackProps({
  dispatchSync,
  isPreloaded,
  isRemovalPrevented,
  navigation,
  state,
}: StandardNavigatorCreatePropsFactoryDeps<StackNavigationState<ParamListBase>>) {
  return {
    isPreloaded,
    isRemovalPrevented,
    pop: makePopAction(dispatchSync, state.key),
    subscribePopToTopOnParentTabPress: () => subscribePopToTopOnParentTabPress(navigation, state),
  };
}
