import type { createStandardNavigator, NavigatorArgs } from 'standard-navigation';

import type {
  DefaultNavigatorOptions,
  DefaultRouterOptions,
  NavigationAction,
  NavigationState,
  ParamListBase,
} from '../react-navigation/native';
import type { GoBackAction, NavigateAction } from '../react-navigation/routers/CommonActions';

export type StandardNavigatorEventMapBase = Record<
  string,
  { data: object | undefined; canPreventDefault: boolean }
>;

export type StandardNavigationAction = NavigateAction | GoBackAction;

export type StandardNavigator<
  NavigatorOptions extends object,
  EventMap extends StandardNavigatorEventMapBase,
  NavigatorProps extends object,
> = ReturnType<typeof createStandardNavigator<NavigatorOptions, EventMap, NavigatorProps>>;

export type StandardUseNavigationBuilderOptions<
  State extends NavigationState,
  NavigatorOptions extends object,
  EventMap extends StandardNavigatorEventMapBase,
> = DefaultNavigatorOptions<
  ParamListBase,
  string | undefined,
  State,
  NavigatorOptions,
  EventMap & StandardNavigatorEventMapBase,
  // `useNavigationBuilder` itself types the screenListeners `navigation` argument as `any`.
  any
>;

export interface StandardNavigatorCreatePropsFactoryDeps<State extends NavigationState> {
  state: State;
  dispatch: (action: NavigationAction) => void;
}

export interface IntegrateWithRouterOptions<
  State extends NavigationState = NavigationState,
  NavigatorProps extends object = object,
> {
  /**
   * When `true`, only screens explicitly declared as `<Navigator.Screen>` children are rendered;
   * routes discovered from the filesystem that were not declared are ignored.
   */
  useOnlyUserDefinedScreens?: boolean;

  /**
   * Allows router-specific information to be exposed via navigator props alongside the standard
   * `state` and `actions`.
   *
   * Receives the raw Expo Router `state` and `dispatch`. Both are internal and may have small
   * breaking changes between releases, so prefer the `state` and `actions` passed to
   * `NavigatorContent` when they suffice.
   *
   * @example
   * ```tsx
   * createProps: ({ state, dispatch }) => ({
   *   activeRouteKey: state.routes[state.index].key,
   *   reset: () => dispatch({ type: 'POP_TO_TOP' }),
   * })
   * ```
   */
  createProps?: (deps: StandardNavigatorCreatePropsFactoryDeps<State>) => Partial<NavigatorProps>;
}

export type StandardNavigatorContentProps<
  NavigatorOptions extends object,
  EventMap extends StandardNavigatorEventMapBase,
  NavigatorProps extends object,
> = NavigatorArgs<NavigatorOptions, EventMap> &
  Omit<NavigatorProps, keyof NavigatorArgs<NavigatorOptions, EventMap>>;

export type StandardRouterNavigatorProps<
  State extends NavigationState,
  NavigatorOptions extends object,
  EventMap extends StandardNavigatorEventMapBase,
  NavigatorProps extends object,
  RouterOptions extends DefaultRouterOptions,
> = StandardUseNavigationBuilderOptions<State, NavigatorOptions, EventMap> &
  NavigatorProps &
  RouterOptions;
