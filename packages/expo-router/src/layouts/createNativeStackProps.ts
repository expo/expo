import type { NativeStackNavigatorCreateProps } from '../fork/native-stack/createNativeStackNavigator';
import type { ParamListBase, StackNavigationState } from '../react-navigation/native';
import type { StandardNavigatorCreatePropsFactoryDeps } from '../standard-navigation/types';
import { createBaseStackProps } from './stack-utils';

/**
 * Creates the props required to integrate Expo Router's native stack navigator.
 *
 * @param dependencies The navigation state and dispatch functions provided to a `createProps`
 * factory.
 * @returns The native stack navigator props.
 */
export function createNativeStackProps({
  dispatch,
  dispatchSync,
  navigation,
  state,
}: Pick<
  StandardNavigatorCreatePropsFactoryDeps<StackNavigationState<ParamListBase>>,
  'dispatch' | 'dispatchSync' | 'navigation' | 'state'
>): NativeStackNavigatorCreateProps {
  return {
    ...createBaseStackProps({ dispatchSync, navigation, state }),
    removeRoutes: (routeNames) => dispatch({ type: 'REMOVE_ROUTES', payload: { routeNames } }),
  };
}
