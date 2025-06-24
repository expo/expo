'use client';

import {
  useIsFocused,
  useStateForPath,
  type EventMapBase,
  type NavigationState,
  type ParamListBase,
  type RouteProp,
  type ScreenListeners,
} from '@react-navigation/native';
import React from 'react';

import { LoadedRoute, Route, RouteNode, sortRoutesWithInitial, useRouteNode } from './Route';
import { useExpoRouterStore } from './global-state/storeContext';
import EXPO_ROUTER_IMPORT_MODE from './import-mode';
import { Screen } from './primitives';
import { UnknownOutputParams } from './types';
import { EmptyRoute } from './views/EmptyRoute';
import { SuspenseFallback } from './views/SuspenseFallback';
import { Try } from './views/Try';

export type ScreenProps<
  TOptions extends Record<string, any> = Record<string, any>,
  TState extends NavigationState = NavigationState,
  TEventMap extends EventMapBase = EventMapBase,
> = {
  /** Name is required when used inside a Layout component. */
  name?: string;
  /**
   * Redirect to the nearest sibling route.
   * If all children are `redirect={true}`, the layout will render `null` as there are no children to render.
   */
  redirect?: boolean;
  initialParams?: Record<string, any>;
  options?:
    | TOptions
    | ((prop: { route: RouteProp<ParamListBase, string>; navigation: any }) => TOptions);

  listeners?:
    | ScreenListeners<TState, TEventMap>
    | ((prop: {
        route: RouteProp<ParamListBase, string>;
        navigation: any;
      }) => ScreenListeners<TState, TEventMap>);

  getId?: ({ params }: { params?: Record<string, any> }) => string | undefined;

  dangerouslySingular?: SingularOptions;
};

export type SingularOptions =
  | boolean
  | ((name: string, params: UnknownOutputParams) => string | undefined);

function getSortedChildren(
  children: RouteNode[],
  order: ScreenProps[] = [],
  initialRouteName?: string
): { route: RouteNode; props: Partial<ScreenProps> }[] {
  if (!order?.length) {
    return children
      .sort(sortRoutesWithInitial(initialRouteName))
      .map((route) => ({ route, props: {} }));
  }
  const entries = [...children];

  const ordered = order
    .map(
      ({
        name,
        redirect,
        initialParams,
        listeners,
        options,
        getId,
        dangerouslySingular: singular,
      }) => {
        if (!entries.length) {
          console.warn(
            `[Layout children]: Too many screens defined. Route "${name}" is extraneous.`
          );
          return null;
        }
        const matchIndex = entries.findIndex((child) => child.route === name);
        if (matchIndex === -1) {
          console.warn(
            `[Layout children]: No route named "${name}" exists in nested children:`,
            children.map(({ route }) => route)
          );
          return null;
        } else {
          // Get match and remove from entries
          const match = entries[matchIndex];
          entries.splice(matchIndex, 1);

          // Ensure to return null after removing from entries.
          if (redirect) {
            if (typeof redirect === 'string') {
              throw new Error(`Redirecting to a specific route is not supported yet.`);
            }
            return null;
          }

          if (getId) {
            console.warn(
              `Deprecated: prop 'getId' on screen ${name} is deprecated. Please rename the prop to 'dangerouslySingular'`
            );
            if (singular) {
              console.warn(
                `Screen ${name} cannot use both getId and dangerouslySingular together.`
              );
            }
          } else if (singular) {
            // If singular is set, use it as the getId function.
            if (typeof singular === 'string') {
              getId = () => singular;
            } else if (typeof singular === 'function' && name) {
              getId = (options) => singular(name, options.params || {});
            } else if (singular === true && name) {
              getId = (options) => getSingularId(name, options);
            }
          }

          return {
            route: match,
            props: { initialParams, listeners, options, getId },
          };
        }
      }
    )
    .filter(Boolean) as {
    route: RouteNode;
    props: Partial<ScreenProps>;
  }[];

  // Add any remaining children
  ordered.push(
    ...entries.sort(sortRoutesWithInitial(initialRouteName)).map((route) => ({ route, props: {} }))
  );

  return ordered;
}

/**
 * @returns React Navigation screens sorted by the `route` property.
 */
export function useSortedScreens(
  order: ScreenProps[],
  protectedScreens: Set<string>
): React.ReactNode[] {
  const node = useRouteNode();

  const sorted = node?.children?.length
    ? getSortedChildren(node.children, order, node.initialRouteName)
    : [];
  return React.useMemo(
    () =>
      sorted
        .filter((item) => !protectedScreens.has(item.route.route))
        .map((value) => {
          return routeToScreen(value.route, value.props);
        }),
    [sorted, protectedScreens]
  );
}

function fromImport(value: RouteNode, { ErrorBoundary, ...component }: LoadedRoute) {
  // If possible, add a more helpful display name for the component stack to improve debugging of React errors such as `Text strings must be rendered within a <Text> component.`.
  if (component?.default && __DEV__) {
    component.default.displayName ??= `${component.default.name ?? 'Route'}(${value.contextKey})`;
  }

  if (ErrorBoundary) {
    const Wrapped = React.forwardRef((props: any, ref: any) => {
      const children = React.createElement(component.default || EmptyRoute, {
        ...props,
        ref,
      });
      return <Try catch={ErrorBoundary}>{children}</Try>;
    });

    if (__DEV__) {
      Wrapped.displayName = `ErrorBoundary(${value.contextKey})`;
    }

    return {
      default: Wrapped,
    };
  }
  if (process.env.NODE_ENV !== 'production') {
    if (
      typeof component.default === 'object' &&
      component.default &&
      Object.keys(component.default).length === 0
    ) {
      return { default: EmptyRoute };
    }
  }

  return { default: component.default };
}

function fromLoadedRoute(value: RouteNode, res: LoadedRoute) {
  if (!(res instanceof Promise)) {
    return fromImport(value, res);
  }

  return res.then(fromImport.bind(null, value));
}

// TODO: Maybe there's a more React-y way to do this?
// Without this store, the process enters a recursive loop.
const qualifiedStore = new WeakMap<RouteNode, React.ComponentType<any>>();

/** Wrap the component with various enhancements and add access to child routes. */
export function getQualifiedRouteComponent(value: RouteNode) {
  if (qualifiedStore.has(value)) {
    return qualifiedStore.get(value)!;
  }

  let ScreenComponent:
    | React.ForwardRefExoticComponent<React.RefAttributes<unknown>>
    | React.ComponentType<any>;

  // TODO: This ensures sync doesn't use React.lazy, but it's not ideal.
  if (EXPO_ROUTER_IMPORT_MODE === 'lazy') {
    ScreenComponent = React.lazy(async () => {
      const res = value.loadRoute();
      return fromLoadedRoute(value, res) as Promise<{
        default: React.ComponentType<any>;
      }>;
    });

    if (__DEV__) {
      ScreenComponent.displayName = `AsyncRoute(${value.route})`;
    }
  } else {
    const res = value.loadRoute();
    ScreenComponent = fromImport(value, res).default!;
  }
  function BaseRoute({
    // Remove these React Navigation props to
    // enforce usage of expo-router hooks (where the query params are correct).
    route,
    navigation,

    // Pass all other props to the component
    ...props
  }: any) {
    const stateForPath = useStateForPath();
    const isFocused = useIsFocused();
    const store = useExpoRouterStore();

    if (isFocused) {
      const state = navigation.getState();
      const isLeaf = !('state' in state.routes[state.index]);
      if (isLeaf && stateForPath) store.setFocusedState(stateForPath);
    }

    return (
      <Route node={value} route={route}>
        <React.Suspense fallback={<SuspenseFallback route={value} />}>
          <ScreenComponent
            {...props}
            // Expose the template segment path, e.g. `(home)`, `[foo]`, `index`
            // the intention is to make it possible to deduce shared routes.
            segment={value.route}
          />
        </React.Suspense>
      </Route>
    );
  }

  if (__DEV__) {
    BaseRoute.displayName = `Route(${value.route})`;
  }

  qualifiedStore.set(value, BaseRoute);
  return BaseRoute;
}

export function screenOptionsFactory(
  route: RouteNode,
  options?: ScreenProps['options']
): ScreenProps['options'] {
  return (args) => {
    // Only eager load generated components
    const staticOptions = route.generated ? route.loadRoute()?.getNavOptions : null;
    const staticResult = typeof staticOptions === 'function' ? staticOptions(args) : staticOptions;
    const dynamicResult = typeof options === 'function' ? options?.(args) : options;
    const output = {
      ...staticResult,
      ...dynamicResult,
    };

    // Prevent generated screens from showing up in the tab bar.
    if (route.internal) {
      output.tabBarItemStyle = { display: 'none' };
      output.tabBarButton = () => null;
      // TODO: React Navigation doesn't provide a way to prevent rendering the drawer item.
      output.drawerItemStyle = { height: 0, display: 'none' };
    }

    return output;
  };
}

export function routeToScreen(
  route: RouteNode,
  { options, getId, ...props }: Partial<ScreenProps> = {}
) {
  return (
    <Screen
      {...props}
      name={route.route}
      key={route.route}
      getId={getId}
      options={screenOptionsFactory(route, options)}
      getComponent={() => getQualifiedRouteComponent(route)}
    />
  );
}

export function getSingularId(name: string, options: Record<string, any> = {}) {
  return name
    .split('/')
    .map((segment) => {
      if (segment.startsWith('[...')) {
        return options.params?.[segment.slice(4, -1)]?.join('/') || segment;
      } else if (segment.startsWith('[') && segment.endsWith(']')) {
        return options.params?.[segment.slice(1, -1)] || segment;
      } else {
        return segment;
      }
    })
    .join('/');
}
