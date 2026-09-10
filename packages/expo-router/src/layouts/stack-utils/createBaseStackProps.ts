import type { ParamListBase, StackNavigationState } from '../../react-navigation/native';
import { makePopAction } from '../../react-navigation/native-stack/utils/makePopAction';
import { subscribePopToTopOnParentTabPress } from '../../standard-navigation/subscribePopToTopOnParentTabPress';
import type { StandardNavigatorCreatePropsFactoryDeps } from '../../standard-navigation/types';

/**
 * Creates the shared props for integrating a stack navigator with Expo Router.
 * The returned `pop` function dispatches synchronously.
 *
 * @param dependencies The navigation state and dispatch functions provided to a `createProps`
 * factory.
 * @returns The shared stack navigator props.
 */
export function createBaseStackProps({
  dispatchSync,
  navigation,
  state,
}: StandardNavigatorCreatePropsFactoryDeps<StackNavigationState<ParamListBase>>) {
  return {
    pop: makePopAction(dispatchSync, state.key),
    subscribePopToTopOnParentTabPress: () => subscribePopToTopOnParentTabPress(navigation, state),
  };
}
