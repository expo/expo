'use client';
import * as React from 'react';
import { use } from 'react';

import type {
  NavigationAction,
  NavigationState,
  ParamListBase,
  PartialState,
  Router,
} from '../routers';
import {
  type AddKeyedListener,
  type AddListener,
  NavigationBuilderContext,
} from './NavigationBuilderContext';
import { NavigationProvider } from './NavigationProvider';
import { SceneView } from './SceneView';
import { ThemeContext } from './theming/ThemeContext';
import type {
  Descriptor,
  DescriptorRouteProp,
  EventMapBase,
  NavigationHelpers,
  NavigationProp,
  RouteConfig,
  RouteProp,
} from './types';
import type { NavigationEventEmitter } from './useEventEmitter';
import { useNavigationCache } from './useNavigationCache';
import { useRouteCache } from './useRouteCache';

export type ScreenConfigWithParent<
  State extends NavigationState,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  ScreenOptions extends {},
  EventMap extends EventMapBase,
> = {
  options: (ScreenOptionsOrCallback<ScreenOptions> | undefined)[] | undefined;
  layout: ScreenLayout<ScreenOptions> | undefined;
  props: RouteConfig<ParamListBase, string, State, ScreenOptions, EventMap, unknown>;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type ScreenLayout<ScreenOptions extends {}> = (props: {
  route: RouteProp<ParamListBase, string>;
  options: ScreenOptions;
  navigation: any;
  theme: ReactNavigation.Theme;
  children: React.ReactElement;
}) => React.ReactElement;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type ScreenOptionsOrCallback<ScreenOptions extends {}> =
  | ScreenOptions
  | ((props: {
      route: DescriptorRouteProp<ParamListBase, string>;
      navigation: any;
      theme: ReactNavigation.Theme;
    }) => ScreenOptions);

type Options<
  State extends NavigationState,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  ScreenOptions extends {},
  EventMap extends EventMapBase,
> = {
  routes: State['routes'];
  routeNames: State['routeNames'];
  screens: Record<string, ScreenConfigWithParent<State, ScreenOptions, EventMap>>;
  navigation: NavigationHelpers<ParamListBase>;
  screenOptions: ScreenOptionsOrCallback<ScreenOptions> | undefined;
  screenLayout: ScreenLayout<ScreenOptions> | undefined;
  getState: () => State;
  addListener: AddListener;
  addKeyedListener: AddKeyedListener;
  router: Router<State, NavigationAction>;
  emitter: NavigationEventEmitter<EventMap>;
};

/**
 * Hook to create descriptor objects for the child routes.
 *
 * A descriptor object provides 3 things:
 * - Helper method to render a screen
 * - Options specified by the screen for the navigator
 * - Navigation object intended for the route
 */
export function useDescriptors<
  State extends NavigationState,
  ActionHelpers extends Record<string, () => void>,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  ScreenOptions extends {},
  EventMap extends EventMapBase,
>({
  routes,
  routeNames,
  screens,
  navigation,
  screenOptions,
  screenLayout,
  getState,
  addListener,
  addKeyedListener,
  router,
  emitter,
}: Options<State, ScreenOptions, EventMap>) {
  const theme = use(ThemeContext);
  const [options, setOptions] = React.useState<Record<string, ScreenOptions>>({});
  const {
    handleAction,
    getStateForKey,
    resetNavigator,
    onDispatchAction,
    onOptionsChange,
    stackRef,
  } = use(NavigationBuilderContext);

  const context = React.useMemo(
    () => ({
      navigation,
      handleAction,
      getStateForKey,
      resetNavigator,
      addListener,
      addKeyedListener,
      onDispatchAction,
      onOptionsChange,
      stackRef,
    }),
    [
      navigation,
      handleAction,
      getStateForKey,
      resetNavigator,
      addListener,
      addKeyedListener,
      onDispatchAction,
      onOptionsChange,
      stackRef,
    ]
  );

  const getNavigation = useNavigationCache<State, ScreenOptions, EventMap, ActionHelpers>({
    routes,
    routeNames,
    getState,
    navigation,
    setOptions,
    router,
    emitter,
  });

  const cachedRoutes = useRouteCache(routes);

  const getOptions = (
    route: DescriptorRouteProp<ParamListBase, string>,
    navigation: NavigationProp<
      ParamListBase,
      string,
      string | undefined,
      State,
      ScreenOptions,
      EventMap
    >,
    overrides: Record<string, ScreenOptions>
  ) => {
    const config = screens[route.name]!;
    const screen = config.props;

    const optionsList = [
      // The default `screenOptions` passed to the navigator
      screenOptions,
      // The `screenOptions` props passed to `Group` elements
      ...((config.options
        ? config.options.filter(Boolean)
        : []) as ScreenOptionsOrCallback<ScreenOptions>[]),
      // The `options` prop passed to `Screen` elements,
      screen.options,
      // The options set via `navigation.setOptions`
      overrides,
    ];

    return optionsList.reduce<ScreenOptions>(
      (acc, curr) =>
        Object.assign(
          acc,
          // @ts-expect-error: we check for function but TS still complains
          typeof curr !== 'function' ? curr : curr({ route, navigation, theme })
        ),
      {} as ScreenOptions
    );
  };

  const render = (
    route: RouteProp<ParamListBase, string>,
    navigation: NavigationProp<
      ParamListBase,
      string,
      string | undefined,
      State,
      ScreenOptions,
      EventMap
    >,
    customOptions: ScreenOptions,
    routeState: NavigationState | PartialState<NavigationState> | undefined
  ) => {
    const config = screens[route.name]!;
    const screen = config.props;

    const clearOptions = () =>
      setOptions((o) => {
        if (route.key in o) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [route.key]: _, ...rest } = o;
          return rest;
        }

        return o;
      });

    const layout =
      // The `layout` prop passed to `Screen` elements,
      screen.layout ??
      // The `screenLayout` props passed to `Group` elements
      config.layout ??
      // The default `screenLayout` passed to the navigator
      screenLayout;

    let element = (
      <SceneView
        navigation={navigation}
        route={route}
        screen={screen}
        routeState={routeState}
        options={customOptions}
        clearOptions={clearOptions}
      />
    );

    if (layout != null) {
      element = layout({
        route,
        navigation,
        options: customOptions,
        // @ts-expect-error: in practice `theme` will be defined
        theme,
        children: element,
      });
    }

    return (
      <NavigationBuilderContext.Provider key={route.key} value={context}>
        <NavigationProvider route={route} navigation={navigation}>
          {element}
        </NavigationProvider>
      </NavigationBuilderContext.Provider>
    );
  };

  // TODO: Unify this with the standard-navigation descriptor-map type.
  type DescriptorMap = Record<
    string,
    Descriptor<
      ScreenOptions,
      NavigationProp<ParamListBase, string, string | undefined, State, ScreenOptions, EventMap> &
        ActionHelpers,
      RouteProp<ParamListBase>
    >
  >;

  const descriptors = cachedRoutes.reduce<DescriptorMap>((acc, route, i) => {
    const navigation = getNavigation(route);

    if (screens[route.name] === undefined) {
      acc[route.key] = {
        route,
        // @ts-expect-error: it's missing action helpers, fix later
        navigation,
        options: {} as ScreenOptions,
        render: () => null,
      };

      return acc;
    }

    const customOptions = getOptions(route, navigation, options[route.key]!);
    const element = render(route, navigation, customOptions, routes[i]!.state);

    acc[route.key] = {
      route,
      // @ts-expect-error: it's missing action helpers, fix later
      navigation,
      render() {
        return element;
      },
      options: customOptions as ScreenOptions,
      routeSource: screens[route.name]?.props.routeSource,
    };

    return acc;
  }, {});

  // Placeholder descriptors need a cast because `useNavigationCache` adds action helpers at
  // runtime, but its return type omits them.
  // TODO: Fix the `useNavigationCache` return type and remove these casts.
  // TODO: Stabilize screens, options, descriptors, and `describe` without relying on React Compiler.
  const describe = (route: DescriptorRouteProp<ParamListBase, string>) => {
    if (route.key !== undefined) {
      const descriptor = descriptors[route.key];
      if (!descriptor) {
        throw new Error(`Couldn't find a route with the key ${route.key}.`);
      }
      return descriptor;
    }

    const config = screens[route.name];
    if (!config) {
      return {
        route,
        navigation: getNavigation({ key: route.name, name: route.name }),
        options: {} as ScreenOptions,
        render: () => null,
      } as DescriptorMap[string];
    }

    const navigation = getNavigation({ key: route.name, name: route.name });
    return {
      route,
      navigation,
      options: getOptions(route, navigation, {}),
      render: () => null,
      routeSource: config.props.routeSource,
    } as DescriptorMap[string];
  };

  return { describe, descriptors };
}
