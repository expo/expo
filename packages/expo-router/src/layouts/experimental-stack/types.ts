import type {
  DefaultNavigatorOptions,
  Descriptor,
  NavigationHelpers,
  NavigationProp,
  ParamListBase,
  RouteProp,
  StackActionHelpers,
  StackNavigationState,
  StackRouterOptions,
} from '../../react-navigation/native';

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
  transitionStart: { data: { closing: boolean } };
  transitionEnd: { data: { closing: boolean } };
  gestureCancel: { data: undefined };
};

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

export type ExperimentalStackNavigatorProps = DefaultNavigatorOptions<
  ParamListBase,
  string | undefined,
  StackNavigationState<ParamListBase>,
  ExperimentalStackNavigationOptions,
  ExperimentalStackNavigationEventMap,
  ExperimentalStackNavigationProp<ParamListBase>
> &
  StackRouterOptions;

export type ExperimentalStackDescriptor = Descriptor<
  ExperimentalStackNavigationOptions,
  ExperimentalStackNavigationProp<ParamListBase>,
  RouteProp<ParamListBase>
>;

export type ExperimentalStackDescriptorMap = {
  [key: string]: ExperimentalStackDescriptor;
};
