import type {
  NavigationAction,
  NavigationHelpers,
  NavigationProp,
  ParamListBase,
  RouteProp,
  StackActionHelpers,
  StackNavigationState,
} from '../../react-navigation/native';
import type { NativeStackViewState } from '../../react-navigation/native-stack';
import type { StandardNavigatorEmit } from '../../standard-navigation';

/**
 * Options accepted by `ExperimentalStack` screens. Mirrors the narrow option
 * surface of the gamma `<Stack.HeaderConfig>` component from
 * `react-native-screens/experimental`. Anything outside this shape is dropped
 * with a `__DEV__` warning at runtime.
 *
 * @experimental
 */
export type ExperimentalStackNavigationOptions = {
  title?: string;
  headerShown?: boolean;
  headerTransparent?: boolean;
  headerBackVisible?: boolean;
};

/**
 * Navigator-level events emitted by `ExperimentalStack`. Mirrors the subset of
 * `NativeStackNavigationEventMap` that the gamma `Stack.Screen` lifecycle
 * callbacks can drive.
 *
 * @experimental
 */
export type ExperimentalStackNavigationEventMap = {
  removePrevented: { data: { action: NavigationAction } };
  transitionStart: { data: { closing: boolean } };
  transitionEnd: { data: { closing: boolean } };
  gestureCancel: { data: undefined };
};

export type ExperimentalStackViewEmit = StandardNavigatorEmit<ExperimentalStackNavigationEventMap>;

export type ExperimentalStackViewState = NativeStackViewState;

export type ExperimentalStackNavigationProp<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList = string,
  NavigatorID extends string | undefined = undefined,
> = NavigationProp<
  ParamList,
  RouteName,
  NavigatorID,
  StackNavigationState<ParamList>,
  ExperimentalStackNavigationOptions,
  ExperimentalStackNavigationEventMap
> &
  StackActionHelpers<ParamList>;

export type ExperimentalStackScreenProps<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList = string,
  NavigatorID extends string | undefined = undefined,
> = {
  navigation: ExperimentalStackNavigationProp<ParamList, RouteName, NavigatorID>;
  route: RouteProp<ParamList, RouteName>;
};

export type ExperimentalStackNavigationHelpers = NavigationHelpers<
  ParamListBase,
  ExperimentalStackNavigationEventMap
>;
