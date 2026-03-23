import type {
  DefaultRouterOptions,
  InitialState,
  NavigationAction,
  NavigationState,
  ParamListBase,
  PartialState,
  Route,
  Router,
} from '@react-navigation/routers';
import type * as React from 'react';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface RootParamList {}

    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Theme {}
  }
}

type Keyof<T extends {}> = Extract<keyof T, string>;

export type DefaultNavigatorOptions<
  ParamList extends ParamListBase,
  NavigatorID extends string | undefined,
  State extends NavigationState,
  ScreenOptions extends {},
  EventMap extends EventMapBase,
  Navigation,
> = DefaultRouterOptions<Keyof<ParamList>> & {
  /**
   * Children React Elements to extract the route configuration from.
   * Only `Screen`, `Group` and `React.Fragment` are supported as children.
   */
  children: React.ReactNode;

  /**
   * Layout for the navigator.
   * Useful for wrapping with a component with access to navigator's state and options.
   */
  layout?: (props: {
    state: State;
    navigation: NavigationHelpers<ParamList>;
    descriptors: Record<
      string,
      Descriptor<
        ScreenOptions,
        NavigationProp<
          ParamList,
          keyof ParamList,
          string | undefined,
          State,
          ScreenOptions,
          EventMap
        >,
        RouteProp<ParamList>
      >
    >;
    children: React.ReactNode;
  }) => React.ReactElement;

  /**
   * Event listeners for all the screens in the navigator.
   */
  screenListeners?:
    | ScreenListeners<State, EventMap>
    | ((props: {
        route: RouteProp<ParamList>;
        navigation: Navigation;
      }) => ScreenListeners<State, EventMap>);

  /**
   * Default options for all screens under this navigator.
   */
  screenOptions?:
    | ScreenOptions
    | ((props: {
        route: RouteProp<ParamList>;
        navigation: Navigation;
        theme: ReactNavigation.Theme;
      }) => ScreenOptions);

  /**
   * Layout for all screens under this navigator.
   */
  screenLayout?: (
    props: ScreenLayoutArgs<
      ParamList,
      keyof ParamList,
      ScreenOptions,
      Navigation
    >
  ) => React.ReactElement;

  /**
   * A function returning overrides for the underlying router used by the navigator.
   * The overrides will be shallow merged onto the original router.
   * It receives the original router as an argument to the function.
   *
   * This must be a pure function and cannot reference outside dynamic variables.
   */
  UNSTABLE_router?: <Action extends NavigationAction>(
    original: Router<State, Action>
  ) => Partial<Router<State, Action>>;

  /**
   * What should happen when the available route names change.
   * e.g. when different screens are rendered based on a condition.
   *
   * - 'firstMatch': Navigate to the first route in the new list of routes (default).
   * - 'lastUnhandled': Restore the last state that was unhandled due to conditional render.
   *
   * Example cases where previous state might have been unhandled:
   * - Opened a deep link to a screen, but a login screen was shown.
   * - Navigated to a screen containing a navigator, but a different screen was shown.
   * - Reset the navigator to a state with different routes not matching the current list of routes.
   *
   * In these cases, 'lastUnhandled' will reuse the unhandled state if present.
   * If there's no unhandled state, it will fallback to 'firstMatch' behavior.
   *
   * Caveats:
   * - Direct navigation is only handled for `NAVIGATE` actions.
   * - Unhandled state is restored only if the current state becomes invalid, i.e. it doesn't contain any currently defined screens.
   */
  UNSTABLE_routeNamesChangeBehavior?: 'firstMatch' | 'lastUnhandled';
} & (NavigatorID extends string
    ? {
        /**
         * Optional ID for the navigator. Can be used with `navigation.getParent(id)` to refer to a parent.
         */
        id: NavigatorID;
      }
    : {
        id?: undefined;
      });

export type EventMapBase = Record<
  string,
  { data?: any; canPreventDefault?: boolean }
>;

export type EventMapCore<State extends NavigationState> = {
  focus: { data: undefined };
  blur: { data: undefined };
  state: { data: { state: State } };
  beforeRemove: { data: { action: NavigationAction }; canPreventDefault: true };
};

export type EventArg<
  EventName,
  CanPreventDefault extends boolean | undefined = false,
  Data = undefined,
> = {
  /**
   * Type of the event (e.g. `focus`, `blur`)
   */
  readonly type: EventName;
  readonly target?: string;
} & (CanPreventDefault extends true
  ? {
      /**
       * Whether `event.preventDefault()` was called on this event object.
       */
      readonly defaultPrevented: boolean;
      /**
       * Prevent the default action which happens on this event.
       */
      preventDefault(): void;
    }
  : {}) &
  (undefined extends Data
    ? { readonly data?: Readonly<Data> }
    : { readonly data: Readonly<Data> });

export type EventListenerCallback<
  EventMap extends EventMapBase,
  EventName extends keyof EventMap,
  EventCanPreventDefault extends
    | boolean
    | undefined = EventMap[EventName]['canPreventDefault'],
> = (
  e: EventArg<
    EventName,
    undefined extends EventCanPreventDefault ? false : EventCanPreventDefault,
    EventMap[EventName]['data']
  >
) => void;

export type EventConsumer<EventMap extends EventMapBase> = {
  /**
   * Subscribe to events from the parent navigator.
   *
   * @param type Type of the event (e.g. `focus`, `blur`)
   * @param callback Callback listener which is executed upon receiving the event.
   */
  addListener<EventName extends Keyof<EventMap>>(
    type: EventName,
    callback: EventListenerCallback<EventMap, EventName>
  ): () => void;
  removeListener<EventName extends Keyof<EventMap>>(
    type: EventName,
    callback: EventListenerCallback<EventMap, EventName>
  ): void;
};

export type EventEmitter<EventMap extends EventMapBase> = {
  /**
   * Emit an event to child screens.
   *
   * @param options.type Type of the event (e.g. `focus`, `blur`)
   * @param [options.data] Optional information regarding the event.
   * @param [options.target] Key of the target route which should receive the event.
   * If not specified, all routes receive the event.
   */
  emit<EventName extends Keyof<EventMap>>(
    options: {
      type: EventName;
      target?: string;
    } & (EventMap[EventName]['canPreventDefault'] extends true
      ? { canPreventDefault: true }
      : {}) &
      (undefined extends EventMap[EventName]['data']
        ? { data?: EventMap[EventName]['data'] }
        : { data: EventMap[EventName]['data'] })
  ): EventArg<
    EventName,
    EventMap[EventName]['canPreventDefault'],
    EventMap[EventName]['data']
  >;
};

export class PrivateValueStore<T extends [any, any, any]> {
  /**
   * UGLY HACK! DO NOT USE THE TYPE!!!
   *
   * TypeScript requires a type to be used to be able to infer it.
   * The type should exist as its own without any operations such as union.
   * So we need to figure out a way to store this type in a property.
   * The problem with a normal property is that it shows up in intelliSense.
   * Adding private keyword works, but the annotation is stripped away in declaration.
   * Turns out if we use an empty string, it doesn't show up in intelliSense.
   */
  protected ''?: T;
}

type NavigationHelpersCommon<
  ParamList extends ParamListBase,
  State extends NavigationState = NavigationState,
> = {
  /**
   * Dispatch an action or an update function to the router.
   * The update function will receive the current state,
   *
   * @param action Action object or update function.
   */
  dispatch(
    action: NavigationAction | ((state: Readonly<State>) => NavigationAction)
  ): void;

  /**
   * Navigate to a screen in the current or parent navigator.
   * If we're already on the screen, update the params instead.
   *
   * @param screen Name of the route to navigate to.
   * @param [params] Params object for the route.
   * @param [options.merge] Whether to merge the params onto the route. Defaults to `false`.
   * @param [options.pop] Whether to pop routes in a stack to go back to the matching route. Defaults to `false`.
   */
  navigate<RouteName extends keyof ParamList>(
    ...args: // This condition allows us to iterate over a union type
    // This is to avoid getting a union of all the params from `ParamList[RouteName]`,
    // which will get our types all mixed up if a union RouteName is passed in.
    RouteName extends unknown
      ? // This condition checks if the params are optional,
        // which means it's either undefined or a union with undefined
        undefined extends ParamList[RouteName]
        ? [
            screen: RouteName,
            params?: ParamList[RouteName],
            options?: { merge?: boolean; pop?: boolean },
          ]
        : [
            screen: RouteName,
            params: ParamList[RouteName],
            options?: { merge?: boolean; pop?: boolean },
          ]
      : never
  ): void;

  /**
   * Navigate to a route in current navigation tree.
   *
   * @param options.name Name of the route to navigate to.
   * @param [options.params] Params object for the route.
   * @param [options.path] Path to associate the route with (e.g. for deep links).
   * @param [options.merge] Whether to merge the params onto the route. Defaults to `false`.
   * @param [options.pop] Whether to pop routes in a stack to go back to the matching route. Defaults to `false`.
   */
  navigate<RouteName extends keyof ParamList>(
    options: RouteName extends unknown
      ? {
          name: RouteName;
          params: ParamList[RouteName];
          path?: string;
          merge?: boolean;
          pop?: boolean;
        }
      : never
  ): void;

  /**
   * Navigate to a route in current navigation tree.
   *
   * @deprecated Use `navigate` instead.
   *
   * @param screen Name of the route to navigate to.
   * @param [params] Params object for the route.
   */
  navigateDeprecated<RouteName extends keyof ParamList>(
    ...args: RouteName extends unknown
      ? undefined extends ParamList[RouteName]
        ? [screen: RouteName, params?: ParamList[RouteName]]
        : [screen: RouteName, params: ParamList[RouteName]]
      : never
  ): void;

  /**
   * Navigate to a route in current navigation tree.
   *
   * @deprecated Use `navigate` instead.
   *
   * @param options Object with `name` for the route to navigate to, and a `params` object.
   */
  navigateDeprecated<RouteName extends keyof ParamList>(
    options: RouteName extends unknown
      ? {
          name: RouteName;
          params: ParamList[RouteName];
          merge?: boolean;
        }
      : never
  ): void;

  /**
   * Preloads the route in current navigation tree.
   *
   * @param screen Name of the route to preload.
   * @param [params] Params object for the route.
   */
  preload<RouteName extends keyof ParamList>(
    ...args: RouteName extends unknown
      ? undefined extends ParamList[RouteName]
        ? [screen: RouteName, params?: ParamList[RouteName]]
        : [screen: RouteName, params: ParamList[RouteName]]
      : never
  ): void;

  /**
   * Reset the navigation state to the provided state.
   *
   * @param state Navigation state object.
   */
  reset(state: PartialState<State> | State): void;

  /**
   * Go back to the previous route in history.
   */
  goBack(): void;

  /**
   * Check if the screen is focused. The method returns `true` if focused, `false` otherwise.
   * Note that this method doesn't re-render screen when the focus changes. So don't use it in `render`.
   * To get notified of focus changes, use `addListener('focus', cb)` and `addListener('blur', cb)`.
   * To conditionally render content based on focus state, use the `useIsFocused` hook.
   */
  isFocused(): boolean;

  /**
   * Check if dispatching back action will be handled by navigation.
   * Note that this method doesn't re-render screen when the result changes. So don't use it in `render`.
   */
  canGoBack(): boolean;

  /**
   * Returns the name of the navigator specified in the `name` prop.
   * If no name is specified, returns `undefined`.
   */
  getId(): string | undefined;

  /**
   * Returns the navigation helpers from a parent navigator based on the ID.
   * If an ID is provided, the navigation helper from the parent navigator with matching ID (including current) will be returned.
   * If no ID is provided, the navigation helper from the immediate parent navigator will be returned.
   *
   * @param id Optional ID of a parent navigator.
   */
  getParent<T = NavigationHelpers<ParamListBase> | undefined>(id?: string): T;

  /**
   * Returns the navigator's state.
   * Note that this method doesn't re-render screen when the result changes. So don't use it in `render`.
   */
  getState(): State;
} & PrivateValueStore<[ParamList, unknown, unknown]>;

type NavigationHelpersRoute<
  ParamList extends {},
  RouteName extends keyof ParamList = Keyof<ParamList>,
> = {
  /**
   * Update the param object for the route.
   * The new params will be shallow merged with the old one.
   *
   * @param params Partial params object for the current route.
   */
  setParams(
    params: ParamList[RouteName] extends undefined
      ? undefined
      : Partial<ParamList[RouteName]>
  ): void;

  /**
   * Replace the param object for the route
   *
   * @param params Params object for the current route.
   */
  replaceParams(
    params: ParamList[RouteName] extends undefined
      ? undefined
      : ParamList[RouteName]
  ): void;
};

export type NavigationHelpers<
  ParamList extends ParamListBase,
  EventMap extends EventMapBase = {},
> = NavigationHelpersCommon<ParamList> &
  EventEmitter<EventMap> &
  NavigationHelpersRoute<ParamList, keyof ParamList>;

export type NavigationContainerProps = {
  /**
   * Initial state object for the navigation tree.
   */
  initialState?: InitialState;
  /**
   * Callback which is called with the latest navigation state when it changes.
   */
  onStateChange?: (state: Readonly<NavigationState> | undefined) => void;
  /**
   * Callback which is called after the navigation tree mounts.
   */
  onReady?: () => void;
  /**
   * Callback which is called when an action is not handled.
   */
  onUnhandledAction?: (action: Readonly<NavigationAction>) => void;
  /**
   * Whether child navigator should handle a navigation action.
   * The child navigator needs to be mounted before it can handle the action.
   * Defaults to `false`.
   *
   * This will be removed in the next major release.
   *
   * @deprecated Use nested navigation API instead
   */
  navigationInChildEnabled?: boolean;
  /**
   * Theme object for the UI elements.
   */
  theme?: ReactNavigation.Theme;
  /**
   * Children elements to render.
   */
  children: React.ReactNode;
};

export type NavigationProp<
  ParamList extends {},
  RouteName extends keyof ParamList = Keyof<ParamList>,
  NavigatorID extends string | undefined = string | undefined,
  State extends NavigationState = NavigationState<ParamList>,
  ScreenOptions extends {} = {},
  EventMap extends EventMapBase = {},
> = Omit<NavigationHelpersCommon<ParamList, State>, 'getParent'> & {
  /**
   * Returns the navigation prop from a parent navigator based on the ID.
   * If an ID is provided, the navigation prop from the parent navigator with matching ID (including current) will be returned.
   * If no ID is provided, the navigation prop from the immediate parent navigator will be returned.
   *
   * @param id Optional ID of a parent navigator.
   */
  getParent<T = NavigationProp<ParamListBase> | undefined>(id?: NavigatorID): T;

  /**
   * Update the options for the route.
   * The options object will be shallow merged with default options object.
   *
   * @param update Options object or a callback which takes the options from navigator config and returns a new options object.
   */
  setOptions(options: Partial<ScreenOptions>): void;
} & NavigationHelpersRoute<ParamList, RouteName> &
  EventConsumer<EventMap & EventMapCore<State>> &
  PrivateValueStore<[ParamList, RouteName, EventMap]>;

export type RouteProp<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList = Keyof<ParamList>,
> = Route<Extract<RouteName, string>, ParamList[RouteName]>;

export type CompositeNavigationProp<
  A extends NavigationProp<ParamListBase, string, any, any, any>,
  B extends NavigationHelpersCommon<ParamListBase, any>,
> = Omit<A & B, keyof NavigationProp<any>> &
  NavigationProp<
    /**
     * Param list from both navigation objects needs to be combined
     * For example, we should be able to navigate to screens in both A and B
     */
    (A extends NavigationHelpersCommon<infer T> ? T : never) &
      (B extends NavigationHelpersCommon<infer U> ? U : never),
    /**
     * The route name should refer to the route name specified in the first type
     * Ideally it should work for any of them, but it's not possible to infer that way
     */
    A extends NavigationProp<any, infer R> ? R : string,
    /**
     * ID from both navigation objects needs to be combined for `getParent`
     */
    | (A extends NavigationProp<any, any, infer I> ? I : never)
    | (B extends NavigationProp<any, any, infer J> ? J : never),
    /**
     * The type of state should refer to the state specified in the first type
     */
    A extends NavigationProp<any, any, any, infer S> ? S : NavigationState,
    /**
     * Screen options should refer to the options specified in the first type
     */
    A extends NavigationProp<any, any, any, any, infer O> ? O : {},
    /**
     * Event consumer config should refer to the config specified in the first type
     * This allows typechecking `addListener`/`removeListener`
     */
    A extends NavigationProp<any, any, any, any, any, infer E> ? E : {}
  >;

export type CompositeScreenProps<
  A extends {
    navigation: NavigationProp<
      ParamListBase,
      string,
      string | undefined,
      any,
      any,
      any
    >;
    route: RouteProp<ParamListBase>;
  },
  B extends {
    navigation: NavigationHelpersCommon<any, any>;
  },
> = {
  navigation: CompositeNavigationProp<A['navigation'], B['navigation']>;
  route: A['route'];
};

export type ScreenLayoutArgs<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList,
  ScreenOptions extends {},
  Navigation,
> = {
  route: RouteProp<ParamList, RouteName>;
  options: ScreenOptions;
  navigation: Navigation;
  theme: ReactNavigation.Theme;
  children: React.ReactElement;
};

export type Descriptor<
  ScreenOptions extends {},
  Navigation extends NavigationProp<any, any, any, any, any, any>,
  Route extends RouteProp<any, any>,
> = {
  /**
   * Render the component associated with this route.
   */
  render(): React.JSX.Element;

  /**
   * Options for the route.
   */
  options: ScreenOptions;

  /**
   * Route object for the screen
   */
  route: Route;

  /**
   * Navigation object for the screen
   */
  navigation: Navigation;
};

export type ScreenListeners<
  State extends NavigationState,
  EventMap extends EventMapBase,
> = Partial<{
  [EventName in keyof (EventMap & EventMapCore<State>)]: EventListenerCallback<
    EventMap & EventMapCore<State>,
    EventName
  >;
}>;

type ScreenComponentType<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList,
> =
  | React.ComponentType<{
      route: RouteProp<ParamList, RouteName>;
      navigation: any;
    }>
  | React.ComponentType<{}>;

export type RouteConfigComponent<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList,
> =
  | {
      /**
       * React component to render for this screen.
       */
      component: ScreenComponentType<ParamList, RouteName>;
      getComponent?: never;
      children?: never;
    }
  | {
      /**
       * Lazily get a React component to render for this screen.
       */
      getComponent: () => ScreenComponentType<ParamList, RouteName>;
      component?: never;
      children?: never;
    }
  | {
      /**
       * Render callback to render content of this screen.
       */
      children: (props: {
        route: RouteProp<ParamList, RouteName>;
        navigation: any;
      }) => React.ReactNode;
      component?: never;
      getComponent?: never;
    };

export type RouteConfigProps<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList,
  State extends NavigationState,
  ScreenOptions extends {},
  EventMap extends EventMapBase,
  Navigation,
> = {
  /**
   * Optional key for this screen. This doesn't need to be unique.
   * If the key changes, existing screens with this name will be removed or reset.
   * Useful when we have some common screens and have conditional rendering.
   */
  navigationKey?: string;

  /**
   * Route name of this screen.
   */
  name: RouteName;

  /**
   * Navigator options for this screen.
   */
  options?:
    | ScreenOptions
    | ((props: {
        route: RouteProp<ParamList, RouteName>;
        navigation: Navigation;
        theme: ReactNavigation.Theme;
      }) => ScreenOptions);

  /**
   * Event listeners for this screen.
   */
  listeners?:
    | ScreenListeners<State, EventMap>
    | ((props: {
        route: RouteProp<ParamList, RouteName>;
        navigation: Navigation;
      }) => ScreenListeners<State, EventMap>);

  /**
   * Layout for this screen.
   * Useful for wrapping the screen with custom containers.
   * e.g. for styling, error boundaries, suspense, etc.
   */
  layout?: (
    props: ScreenLayoutArgs<ParamList, RouteName, ScreenOptions, Navigation>
  ) => React.ReactElement;

  /**
   * Function to return an unique ID for this screen.
   * Receives an object with the route params.
   * For a given screen name, there will always be only one screen corresponding to an ID.
   * If `undefined` is returned, it acts same as no `getId` being specified.
   */
  getId?: ({
    params,
  }: {
    params: Readonly<ParamList[RouteName]>;
  }) => string | undefined;

  /**
   * Initial params object for the route.
   */
  initialParams?: Partial<ParamList[RouteName]>;
};

export type RouteConfig<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList,
  State extends NavigationState,
  ScreenOptions extends {},
  EventMap extends EventMapBase,
  Navigation,
> = RouteConfigProps<
  ParamList,
  RouteName,
  State,
  ScreenOptions,
  EventMap,
  Navigation
> &
  RouteConfigComponent<ParamList, RouteName>;

export type RouteGroupConfig<
  ParamList extends ParamListBase,
  ScreenOptions extends {},
  Navigation,
> = {
  /**
   * Optional key for the screens in this group.
   * If the key changes, all existing screens in this group will be removed or reset.
   */
  navigationKey?: string;

  /**
   * Navigator options for this screen.
   */
  screenOptions?:
    | ScreenOptions
    | ((props: {
        route: RouteProp<ParamList, keyof ParamList>;
        navigation: Navigation;
        theme: ReactNavigation.Theme;
      }) => ScreenOptions);

  /**
   * Layout for the screens inside the group.
   * This will override the `screenLayout` of parent group or navigator.
   */
  screenLayout?:
    | ((
        props: ScreenLayoutArgs<
          ParamList,
          keyof ParamList,
          ScreenOptions,
          Navigation
        >
      ) => React.ReactElement)
    | {
        // FIXME: TypeScript doesn't seem to infer `navigation` correctly without this
      };

  /**
   * Children React Elements to extract the route configuration from.
   * Only `Screen`, `Group` and `React.Fragment` are supported as children.
   */
  children: React.ReactNode;
};

export type NavigationContainerEventMap = {
  /**
   * Event that fires when the navigation container is ready to be used.
   */
  ready: {
    data: undefined;
  };
  /**
   * Event that fires when the navigation state changes.
   */
  state: {
    data: {
      /**
       * The updated state object after the state change.
       */
      state: NavigationState | PartialState<NavigationState> | undefined;
    };
  };
  /**
   * Event that fires when current options changes.
   */
  options: { data: { options: object } };
  /**
   * Event that fires when an action is dispatched.
   * Only intended for debugging purposes, don't use it for app logic.
   * This event will be emitted before state changes have been applied.
   */
  __unsafe_action__: {
    data: {
      /**
       * The action object that was dispatched.
       */
      action: NavigationAction;
      /**
       * Whether the action was a no-op, i.e. resulted any state changes.
       */
      noop: boolean;
      /**
       * Stack trace of the action, this will only be available during development.
       */
      stack: string | undefined;
    };
  };
};

type NotUndefined<T> = T extends undefined ? never : T;

export type ParamListRoute<ParamList extends ParamListBase> = {
  [RouteName in keyof ParamList]: NavigatorScreenParams<{}> extends ParamList[RouteName]
    ? NotUndefined<ParamList[RouteName]> extends NavigatorScreenParams<infer T>
      ? ParamListRoute<T>
      : Route<Extract<RouteName, string>, ParamList[RouteName]>
    : Route<Extract<RouteName, string>, ParamList[RouteName]>;
}[keyof ParamList];

type MaybeParamListRoute<ParamList extends {}> = ParamList extends ParamListBase
  ? ParamListRoute<ParamList>
  : Route<string>;

export type NavigationContainerRef<ParamList extends {}> =
  NavigationHelpers<ParamList> &
    EventConsumer<NavigationContainerEventMap> & {
      /**
       * Reset the navigation state of the root navigator to the provided state.
       *
       * @param state Navigation state object.
       */
      resetRoot(state?: PartialState<NavigationState> | NavigationState): void;
      /**
       * Get the rehydrated navigation state of the navigation tree.
       */
      getRootState(): NavigationState;
      /**
       * Get the currently focused navigation route.
       */
      getCurrentRoute(): MaybeParamListRoute<ParamList> | undefined;
      /**
       * Get the currently focused route's options.
       */
      getCurrentOptions(): object | undefined;
      /**
       * Whether the navigation container is ready to handle actions.
       */
      isReady(): boolean;
      /**
       * Stub function for setOptions on navigation object for use with useNavigation.
       */
      setOptions(): never;
      /**
       * Stub function for getParent on navigation object for use with useNavigation.
       */
      getParent(): undefined;
    };

export type NavigationContainerRefWithCurrent<ParamList extends {}> =
  NavigationContainerRef<ParamList> & {
    current: NavigationContainerRef<ParamList> | null;
  };

export type NavigationListBase<ParamList extends ParamListBase> = {
  [RouteName in keyof ParamList]: unknown;
};

export type TypeBag<
  ParamList extends ParamListBase,
  NavigatorID extends string | undefined,
  State extends NavigationState,
  ScreenOptions extends {},
  EventMap extends EventMapBase,
  NavigationList extends NavigationListBase<ParamList>,
  Navigator extends React.ComponentType<any>,
> = {
  ParamList: ParamList;
  NavigatorID: NavigatorID;
  State: State;
  ScreenOptions: ScreenOptions;
  EventMap: EventMap;
  NavigationList: NavigationList;
  Navigator: Navigator;
};

export type NavigatorTypeBagBase = {
  ParamList: {};
  NavigatorID: string | undefined;
  State: NavigationState;
  ScreenOptions: {};
  EventMap: {};
  NavigationList: NavigationListBase<ParamListBase>;
  Navigator: React.ComponentType<any>;
};

export type NavigatorTypeBag<
  ParamList extends ParamListBase,
  NavigatorID extends string | undefined,
  State extends NavigationState,
  ScreenOptions extends {},
  EventMap extends EventMapBase,
  NavigationList extends NavigationListBase<ParamList>,
  Navigator extends React.ComponentType<any>,
> = {
  ParamList: ParamList;
  NavigatorID: NavigatorID;
  State: State;
  ScreenOptions: ScreenOptions;
  EventMap: EventMap;
  NavigationList: NavigationList;
  Navigator: Navigator;
};

export type TypedNavigator<
  Bag extends NavigatorTypeBagBase,
  Config = unknown,
> = TypedNavigatorInternal<
  Bag['ParamList'],
  Bag['NavigatorID'],
  Bag['State'],
  Bag['ScreenOptions'],
  Bag['EventMap'],
  Bag['NavigationList'],
  Bag['Navigator']
> &
  (undefined extends Config ? {} : { config: Config });

type TypedNavigatorInternal<
  ParamList extends ParamListBase,
  NavigatorID extends string | undefined,
  State extends NavigationState,
  ScreenOptions extends {},
  EventMap extends EventMapBase,
  NavigationList extends NavigationListBase<ParamList>,
  Navigator extends React.ComponentType<any>,
> = {
  /**
   * Navigator component which manages the child screens.
   */
  Navigator: React.ComponentType<
    Omit<
      React.ComponentProps<Navigator>,
      keyof DefaultNavigatorOptions<any, any, any, any, any, any>
    > &
      DefaultNavigatorOptions<
        ParamList,
        NavigatorID,
        State,
        ScreenOptions,
        EventMap,
        NavigationList[keyof ParamList]
      >
  >;
  /**
   * Component used for grouping multiple route configuration.
   */
  Group: React.ComponentType<
    RouteGroupConfig<ParamList, ScreenOptions, NavigationList[keyof ParamList]>
  >;
  /**
   * Component used for specifying route configuration.
   */
  Screen: <RouteName extends keyof ParamList>(
    _: RouteConfig<
      ParamList,
      RouteName,
      State,
      ScreenOptions,
      EventMap,
      NavigationList[RouteName]
    >
  ) => null;
};

export type NavigatorScreenParams<ParamList extends {}> =
  | {
      screen?: never;
      params?: never;
      merge?: never;
      initial?: never;
      pop?: never;
      path?: string;
      state: PartialState<NavigationState> | NavigationState | undefined;
    }
  | {
      [RouteName in keyof ParamList]: undefined extends ParamList[RouteName]
        ? {
            screen: RouteName;
            params?: ParamList[RouteName];
            merge?: boolean;
            initial?: boolean;
            path?: string;
            pop?: boolean;
            state?: never;
          }
        : {
            screen: RouteName;
            params: ParamList[RouteName];
            merge?: boolean;
            initial?: boolean;
            path?: string;
            pop?: boolean;
            state?: never;
          };
    }[keyof ParamList];

type PathConfigAlias = {
  /**
   * Path string to match against.
   * e.g. `/users/:id` will match `/users/1` and extract `id` param as `1`.
   */
  path: string;
  /**
   * Whether the path should be consider parent paths or use the exact path.
   * By default, paths are relating to the path config on the parent screen.
   * If `exact` is set to `true`, the parent path configuration is not used.
   */
  exact?: boolean;
  /**
   * An object mapping the param name to a function which parses the param value.
   *
   * @example
   * ```js
   * parse: {
   *   id: Number,
   *   date: (value) => new Date(value)
   * }
   * ```
   */
  parse?: Record<string, (value: string) => any>;
};

export type PathConfig<ParamList extends {}> = Partial<PathConfigAlias> & {
  /**
   * An object mapping the param name to a function which converts the param value to a string.
   * By default, all params are converted to strings using `String(value)`.
   *
   * @example
   * ```js
   * stringify: {
   *   date: (value) => value.toISOString()
   * }
   * ```
   */
  stringify?: Record<string, (value: any) => string>;
  /**
   * Additional path alias that will be matched to the same screen.
   */
  alias?: (string | PathConfigAlias)[];
  /**
   * Path configuration for child screens.
   */
  screens?: PathConfigMap<ParamList>;
  /**
   * Name of the initial route to use for the navigator when the path matches.
   */
  initialRouteName?: keyof ParamList;
};

export type PathConfigMap<ParamList extends {}> = {
  [RouteName in keyof ParamList]?: NonNullable<
    ParamList[RouteName]
  > extends NavigatorScreenParams<infer T extends {}>
    ? string | PathConfig<T>
    : string | Omit<PathConfig<{}>, 'screens' | 'initialRouteName'>;
};
