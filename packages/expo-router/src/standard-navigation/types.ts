import type {
  createStandardNavigator,
  NavigatorArgs,
  NavigatorDescriptor,
} from 'standard-navigation';

import type {
  DefaultNavigatorOptions,
  DefaultRouterOptions,
  EventMapBase,
  NavigationAction,
  NavigationHelpers,
  NavigationState,
  ParamListBase,
  DescriptorRouteProp,
  RouteSource,
} from '../react-navigation/native';
import type { GoBackAction, NavigateAction } from '../react-navigation/routers/CommonActions';
import type { ScreenProps } from '../useScreens';

export type StandardNavigatorEventMapBase = Record<
  string,
  { data: object | undefined; canPreventDefault: boolean }
>;

export type StandardNavigationAction = NavigateAction | GoBackAction;

export type PlaceholderDescriptorMap = Record<
  string,
  {
    route: DescriptorRouteProp<ParamListBase, string>;
    options: object;
    render: () => React.ReactNode;
    routeSource?: RouteSource;
  }
>;

export type DescribePlaceholderRoute = (
  route: DescriptorRouteProp<ParamListBase, string>
) => NonNullable<PlaceholderDescriptorMap[string]>;

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

export interface StandardNavigatorCreatePropsFactoryDeps<State extends NavigationState> {
  state: State;
  dispatch: (action: NavigationAction) => void;
  dispatchSync: (action: NavigationAction) => void;
  navigation: NavigationHelpers<ParamListBase>;
}

/**
 * Allows router-specific information to be exposed via navigator props alongside the standard
 * `state` and `actions`.
 *
 * Receives the processed Expo Router `state` and raw `dispatch`. Both are internal and may have
 * small breaking changes between releases, so prefer the `state` and `actions` passed to
 * `NavigatorContent` when they suffice. When `processState` is provided, `state` is its result.
 *
 * @example
 * ```tsx
 * createProps: ({ state, dispatch }) => ({
 *   activeRouteKey: state.routes[state.index].key,
 *   preload: (name: string) => dispatch({ type: 'PRELOAD', payload: { name } }),
 * })
 * ```
 */
type CreatePropsFn<State extends NavigationState, CreateProps extends object> = (
  deps: StandardNavigatorCreatePropsFactoryDeps<State>
) => CreateProps;

type CreatePropsOption<State extends NavigationState, CreateProps extends object> = [
  keyof CreateProps,
] extends [never]
  ? {
      /**
       * Declare injected props with the fourth type argument of `NavigatorContentProps` before
       * providing this factory.
       */
      createProps?: never;
    }
  : { createProps: CreatePropsFn<State, CreateProps> };

export type IntegrateWithRouterOptions<
  State extends NavigationState = NavigationState,
  CreateProps extends object = object,
  NavigatorOptions extends object = Record<string, any>,
  EventMap extends EventMapBase = EventMapBase,
> = CreatePropsOption<State, CreateProps> & {
  /**
   * Pre-processes the builder state before it is converted to standard-navigation state.
   *
   * @example
   * ```tsx
   * processState: (state) => ({
   *   ...state,
   *   routes: state.routes.filter((route) => route.params?.hidden !== true),
   * })
   * ```
   */
  processState?: (
    state: State,
    descriptors: PlaceholderDescriptorMap,
    describe: DescribePlaceholderRoute
  ) => State;
  /** Creates additional descriptors before `processState` and navigator rendering. */
  processDescriptors?: (
    descriptors: PlaceholderDescriptorMap,
    state: State,
    describe: DescribePlaceholderRoute
  ) => PlaceholderDescriptorMap;
  /**
   * Transforms the screens declared as children of the navigator before they are rendered.
   *
   * @example
   * ```tsx
   * processScreens: (screens) =>
   *   screens.map((screen) => ({ ...screen, options: { ...screen.options, title: screen.name } })),
   * ```
   */
  processScreens?: (
    screens: (ScreenProps<NavigatorOptions, State, EventMap> & { name: string })[]
  ) => (ScreenProps<NavigatorOptions, State, EventMap> & { name: string })[];
};

/**
 * A standard-navigation descriptor extended with Expo Router route information.
 */
export interface StandardNavigatorDescriptor<
  NavigatorOptions extends object,
> extends NavigatorDescriptor<NavigatorOptions> {
  /**
   * Indicates whether Expo Router received the route from a layout declaration or inferred it
   * from the filesystem.
   */
  routeSource?: RouteSource;
}

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
> = Omit<
  StandardUseNavigationBuilderOptions<State, NavigatorOptions, EventMap>,
  'initialRouteName'
> &
  Omit<NavigatorProps, 'initialRouteName'> &
  Omit<RouterOptions, 'initialRouteName'>;
