import type { ParamListBase, TabNavigationState } from '../react-navigation/native';
import type { StandardNavigatorCreatePropsFactoryDeps } from '../standard-navigation/types';

type BaseTabPropsFactoryDeps = Pick<
  StandardNavigatorCreatePropsFactoryDeps<TabNavigationState<ParamListBase>>,
  'dispatch' | 'state'
>;

/**
 * Creates the shared props for integrating a tab navigator with Expo Router.
 *
 * @param dependencies The navigation state and dispatch function provided to a `createProps`
 * factory.
 * @returns The shared tab navigator props.
 */
export function createBaseTabProps({ dispatch, state }: BaseTabPropsFactoryDeps) {
  return {
    routeNames: state.routeNames,
    preload: (name: string) => dispatch({ type: 'PRELOAD', payload: { name } }),
  };
}
