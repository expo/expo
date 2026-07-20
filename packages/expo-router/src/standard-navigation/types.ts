import type { createStandardNavigator, NavigatorArgs } from 'standard-navigation';

import type {
  DefaultNavigatorOptions,
  DefaultRouterOptions,
  Descriptor,
  NavigationAction,
  NavigationHelpers,
  NavigationProp,
  NavigationState,
  ParamListBase,
  RouteProp,
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
  EventMap,
  // `useNavigationBuilder` itself types the screenListeners `navigation` argument as `any`.
  any
>;

export interface StandardNavigatorCreatePropsFactoryDeps<
  State extends NavigationState,
  NavigatorOptions extends object,
  EventMap extends StandardNavigatorEventMapBase,
  ActionHelpers extends Record<string, (...args: any[]) => void>,
> {
  state: State;
  dispatch: (action: NavigationAction) => void;
  navigation: NavigationHelpers<ParamListBase, EventMap> & ActionHelpers;
  descriptors: Record<
    string,
    Descriptor<
      NavigatorOptions,
      NavigationProp<ParamListBase, string, undefined, State, NavigatorOptions, EventMap> &
        ActionHelpers,
      RouteProp<ParamListBase>
    >
  >;
}

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
 *   preload: (name: string) => dispatch({ type: 'PRELOAD', payload: { name } }),
 * })
 * ```
 */
type CreatePropsFn<
  State extends NavigationState,
  NavigatorOptions extends object,
  EventMap extends StandardNavigatorEventMapBase,
  CreateProps extends object,
  ActionHelpers extends Record<string, (...args: any[]) => void>,
> = (
  deps: StandardNavigatorCreatePropsFactoryDeps<State, NavigatorOptions, EventMap, ActionHelpers>
) => CreateProps;

type CreatePropsOption<
  State extends NavigationState,
  NavigatorOptions extends object,
  EventMap extends StandardNavigatorEventMapBase,
  CreateProps extends object,
  ActionHelpers extends Record<string, (...args: any[]) => void>,
> = [keyof CreateProps] extends [never]
  ? {
      /**
       * Declare injected props with the fourth type argument of `NavigatorContentProps` before
       * providing this factory.
       */
      createProps?: never;
    }
  : { createProps: CreatePropsFn<State, NavigatorOptions, EventMap, CreateProps, ActionHelpers> };

export type IntegrateWithRouterOptions<
  State extends NavigationState = NavigationState,
  CreateProps extends object = object,
  NavigatorOptions extends object = object,
  EventMap extends StandardNavigatorEventMapBase = StandardNavigatorEventMapBase,
  ActionHelpers extends Record<string, (...args: any[]) => void> = Record<never, never>,
> = {
  /**
   * When `true`, only screens explicitly declared as `<Navigator.Screen>` children are rendered;
   * routes discovered from the filesystem that were not declared are ignored.
   */
  useOnlyUserDefinedScreens?: boolean;
} & CreatePropsOption<State, NavigatorOptions, EventMap, CreateProps, ActionHelpers>;

export type StandardNavigatorContentProps<
  NavigatorOptions extends object,
  EventMap extends StandardNavigatorEventMapBase,
  NavigatorProps extends object,
> = NavigatorArgs<NavigatorOptions, EventMap> &
  Omit<NavigatorProps, keyof NavigatorArgs<NavigatorOptions, EventMap>>;

/**
 * Lets TypeScript infer `EventMap`, `NavigatorProps`, and `CreateProps` from a `NavigatorContent`
 * component.
 *
 * On their own these can't be inferred: `EventMap` only appears as an argument to `emitter.emit`,
 * while `NavigatorProps` and `CreateProps` are combined inside an intersection and `Omit` — none
 * are positions TypeScript can read a type back out of. Without these properties it gives up and
 * falls back to the base shapes, rejecting components that declare specific events or extra props.
 *
 * The properties are phantom: they never exist at runtime and are never read. They exist only to
 * put each type somewhere TypeScript will infer it from.
 */
type NavigatorContentInferenceCarrier<
  EventMap extends StandardNavigatorEventMapBase,
  NavigatorProps extends object,
  CreateProps extends object,
> = {
  /** @internal */
  readonly __eventMap__?: EventMap;
  /** @internal */
  readonly __navigatorProps__?: NavigatorProps;
  /** @internal */
  readonly __createProps__?: CreateProps;
};

/**
 * Props for a standard navigator's `NavigatorContent` component. Annotate your content component
 * with this type to declare the events it emits, so `unstable_createStandardRouterNavigator` can
 * type `emitter.emit` for you.
 *
 * @example
 * ```tsx
 * // No events:
 * type TabsContentProps = NavigatorContentProps<{ title?: string }>;
 *
 * // Typed events:
 * type TabsContentProps = NavigatorContentProps<
 *   { title?: string },
 *   { tabPress: { data: undefined; canPreventDefault: true } },
 *   { tintColor?: string },
 *   { activeRouteKey: string }
 * >;
 * ```
 */
export type NavigatorContentProps<
  NavigatorOptions extends object,
  EventMap extends StandardNavigatorEventMapBase = Record<string, never>,
  NavigatorProps extends object = object,
  CreateProps extends object = object,
> = StandardNavigatorContentProps<NavigatorOptions, EventMap, NavigatorProps & CreateProps> &
  NavigatorContentInferenceCarrier<EventMap, NavigatorProps, CreateProps>;

export type StandardRouterNavigatorProps<
  State extends NavigationState,
  NavigatorOptions extends object,
  EventMap extends StandardNavigatorEventMapBase,
  NavigatorProps extends object,
  RouterOptions extends DefaultRouterOptions,
> = StandardUseNavigationBuilderOptions<State, NavigatorOptions, EventMap> &
  NavigatorProps &
  RouterOptions;
