import type {
  createStandardNavigator,
  NavigatorArgs,
  NavigatorDescriptor,
} from 'standard-navigation';

import type {
  DefaultNavigatorOptions,
  DefaultRouterOptions,
  NavigationAction,
  NavigationHelpers,
  NavigationState,
  ParamListBase,
  Route,
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

export interface StandardNavigatorCreatePropsFactoryDeps<
  State extends NavigationState,
  NavigatorOptions extends object = object,
> {
  state: State;
  dispatch: (action: NavigationAction) => void;
  navigation: NavigationHelpers<ParamListBase>;
  descriptors: Record<string, NavigatorDescriptor<NavigatorOptions>>;
  describe: (route: Route<string>, placeholder: boolean) => NavigatorDescriptor<NavigatorOptions>;
  /**
   * The deterministic key the router will assign to a route with this name, resolved against the
   * navigator's current state, so a descriptor built for a not-yet-present route reconciles onto the
   * real one once it materializes.
   */
  getKey: (routeName: string) => string;
}

/**
 * Derives the extra `CreateProps` that `NavigatorContent` receives but the navigator element does
 * not accept, from the underlying router state.
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
  CreateProps extends object,
> = (deps: StandardNavigatorCreatePropsFactoryDeps<State, NavigatorOptions>) => CreateProps;

// `createProps` is optional when there are no `CreateProps` to produce, and required once a navigator
// declares them (so its `NavigatorContent` can't be left without props it depends on).
type CreatePropsOption<
  State extends NavigationState,
  NavigatorOptions extends object,
  CreateProps extends object,
> = [keyof CreateProps] extends [never]
  ? { createProps?: CreatePropsFn<State, NavigatorOptions, CreateProps> }
  : { createProps: CreatePropsFn<State, NavigatorOptions, CreateProps> };

export type IntegrateWithRouterOptions<
  State extends NavigationState = NavigationState,
  NavigatorProps extends object = object,
  NavigatorOptions extends object = object,
  CreateProps extends object = object,
> = {
  /**
   * When `true`, only screens explicitly declared as `<Navigator.Screen>` children are rendered;
   * routes discovered from the filesystem that were not declared are ignored.
   */
  useOnlyUserDefinedScreens?: boolean;
} & CreatePropsOption<State, NavigatorOptions, CreateProps>;

export type StandardNavigatorContentProps<
  NavigatorOptions extends object,
  EventMap extends StandardNavigatorEventMapBase,
  NavigatorProps extends object,
> = NavigatorArgs<NavigatorOptions, EventMap> &
  Omit<NavigatorProps, keyof NavigatorArgs<NavigatorOptions, EventMap>>;

/**
 * Lets TypeScript infer `EventMap` and `NavigatorProps` from a `NavigatorContent` component.
 *
 * On their own these can't be inferred: `EventMap` only appears as an argument to `emitter.emit`,
 * and `NavigatorProps` only inside `Omit<NavigatorProps, …>` — neither is a position TypeScript can
 * read a type back out of. Without these two properties it gives up and falls back to the base
 * shapes, rejecting components that declare specific events or extra props.
 *
 * The properties are phantom: they never exist at runtime and are never read. They exist only to
 * put each type somewhere TypeScript will infer it from.
 */
type NavigatorContentInferenceCarrier<
  EventMap extends StandardNavigatorEventMapBase,
  NavigatorProps extends object,
> = {
  /** @internal */
  readonly __eventMap__?: EventMap;
  /** @internal */
  readonly __navigatorProps__?: NavigatorProps;
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
 *   { tabPress: { data: undefined; canPreventDefault: true } }
 * >;
 * ```
 */
export type NavigatorContentProps<
  NavigatorOptions extends object,
  EventMap extends StandardNavigatorEventMapBase = Record<string, never>,
  NavigatorProps extends object = object,
> = StandardNavigatorContentProps<NavigatorOptions, EventMap, NavigatorProps> &
  NavigatorContentInferenceCarrier<EventMap, NavigatorProps>;

export type StandardRouterNavigatorProps<
  State extends NavigationState,
  NavigatorOptions extends object,
  EventMap extends StandardNavigatorEventMapBase,
  NavigatorProps extends object,
  RouterOptions extends DefaultRouterOptions,
> = StandardUseNavigationBuilderOptions<State, NavigatorOptions, EventMap> &
  NavigatorProps &
  RouterOptions;
