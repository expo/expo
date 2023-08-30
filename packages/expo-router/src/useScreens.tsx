import type {
  EventMapBase,
  NavigationState,
  ParamListBase,
  RouteProp,
  ScreenListeners,
} from '@react-navigation/native';
import React from 'react';

import {
  DynamicConvention,
  LoadedRoute,
  Route,
  RouteNode,
  sortRoutesWithInitial,
  useRouteNode,
} from './Route';
import EXPO_ROUTER_IMPORT_MODE from './import-mode';
import { Screen } from './primitives';
import { EmptyRoute } from './views/EmptyRoute';
import { SuspenseFallback } from './views/SuspenseFallback';
import { Try } from './views/Try';

export type ScreenProps<
  TOptions extends Record<string, any> = Record<string, any>,
  State extends NavigationState = NavigationState,
  EventMap extends EventMapBase = EventMapBase,
> = {
  /** Name is required when used inside a Layout component. */
  name?: string;
  /**
   * Redirect to the nearest sibling route.
   * If all children are redirect={true}, the layout will render `null` as there are no children to render.
   */
  redirect?: boolean;
  initialParams?: { [key: string]: any };
  options?: TOptions;

  listeners?:
    | ScreenListeners<State, EventMap>
    | ((prop: {
        route: RouteProp<ParamListBase, string>;
        navigation: any;
      }) => ScreenListeners<State, EventMap>);

  getId?: ({ params }: { params?: Record<string, any> | undefined }) => string | undefined;
};

function getSortedChildren(
  children: RouteNode[],
  order?: ScreenProps[],
  initialRouteName?: string
): { route: RouteNode; props: Partial<ScreenProps> }[] {
  if (!order?.length) {
    return children
      .sort(sortRoutesWithInitial(initialRouteName))
      .map((route) => ({ route, props: {} }));
  }
  const entries = [...children];

  const ordered = order
    .map(({ name, redirect, initialParams, listeners, options, getId }) => {
      if (!entries.length) {
        console.warn(`[Layout children]: Too many screens defined. Route "${name}" is extraneous.`);
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

        return {
          route: match,
          props: { initialParams, listeners, options, getId },
        };
      }
    })
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
export function useSortedScreens(order: ScreenProps[]): React.ReactNode[] {
  const node = useRouteNode();

  const sorted = node?.children?.length
    ? getSortedChildren(node.children, order, node.initialRouteName)
    : [];
  return React.useMemo(
    () => sorted.map((value) => routeToScreen(value.route, value.props)),
    [sorted]
  );
}

function fromImport({ ErrorBoundary, ...component }: LoadedRoute) {
  if (ErrorBoundary) {
    return {
      default: React.forwardRef((props: any, ref: any) => {
        const children = React.createElement(component.default || EmptyRoute, {
          ...props,
          ref,
        });
        return <Try catch={ErrorBoundary}>{children}</Try>;
      }),
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
  return { default: component.default || EmptyRoute };
}

function fromLoadedRoute(res: LoadedRoute) {
  if (!(res instanceof Promise)) {
    return fromImport(res);
  }

  return res.then(fromImport);
}

// TODO: Maybe there's a more React-y way to do this?
// Without this store, the process enters a recursive loop.
const qualifiedStore = new WeakMap<RouteNode, React.ComponentType<any>>();

/** Wrap the component with various enhancements and add access to child routes. */
export function getQualifiedRouteComponent(value: RouteNode) {
  if (qualifiedStore.has(value)) {
    return qualifiedStore.get(value)!;
  }

  let getLoadable: (props: any, ref: any) => JSX.Element;

  // TODO: This ensures sync doesn't use React.lazy, but it's not ideal.
  if (EXPO_ROUTER_IMPORT_MODE === 'lazy') {
    const AsyncComponent = React.lazy(async () => {
      const res = value.loadRoute();
      return fromLoadedRoute(res) as Promise<{
        default: React.ComponentType<any>;
      }>;
    });
    getLoadable = (props: any, ref: any) => (
      <React.Suspense fallback={<SuspenseFallback route={value} />}>
        <AsyncComponent
          {...{
            ...props,
            ref,
            // Expose the template segment path, e.g. `(home)`, `[foo]`, `index`
            // the intention is to make it possible to deduce shared routes.
            segment: value.route,
          }}
        />
      </React.Suspense>
    );
  } else {
    const SyncComponent = React.forwardRef((props, ref) => {
      const res = value.loadRoute();
      const Component = fromImport(res).default;
      return <Component {...props} ref={ref} />;
    });

    getLoadable = (props: any, ref: any) => (
      <SyncComponent
        {...{
          ...props,
          ref,
          // Expose the template segment path, e.g. `(home)`, `[foo]`, `index`
          // the intention is to make it possible to deduce shared routes.
          segment: value.route,
        }}
      />
    );
  }

  const QualifiedRoute = React.forwardRef(
    (
      {
        // Remove these React Navigation props to
        // enforce usage of expo-router hooks (where the query params are correct).
        route,
        navigation,

        // Pass all other props to the component
        ...props
      }: any,
      ref: any
    ) => {
      const loadable = getLoadable(props, ref);

      return <Route node={value}>{loadable}</Route>;
    }
  );

  QualifiedRoute.displayName = `Route(${value.route})`;

  qualifiedStore.set(value, QualifiedRoute);
  return QualifiedRoute;
}

/** @returns a function which provides a screen id that matches the dynamic route name in params. */
export function createGetIdForRoute(route: Pick<RouteNode, 'dynamic' | 'route'>) {
  if (!route.dynamic?.length) {
    return undefined;
  }
  return ({ params }: { params?: Record<string, any> }) => {
    const getPreferredId = (segment: DynamicConvention) => {
      // Params can be undefined when there are no params in the route.
      const preferredId = params?.[segment.name];
      // If the route has a dynamic segment, use the matching parameter
      // as the screen id. This enables pushing a screen like `/[user]` multiple times
      // when the user is different.
      if (preferredId) {
        if (!Array.isArray(preferredId)) {
          return preferredId;
        } else if (preferredId.length) {
          // Deep dynamic routes will return as an array, so we'll join them to create a
          // fully qualified string.
          return preferredId.join('/');
        }
        // Empty arrays...
      }
      return segment.deep ? `[...${segment.name}]` : `[${segment.name}]`;
    };
    return route.dynamic?.map((segment) => getPreferredId(segment)).join('/');
  };
}

function routeToScreen(route: RouteNode, { options, ...props }: Partial<ScreenProps> = {}) {
  return (
    <Screen
      // Users can override the screen getId function.
      getId={createGetIdForRoute(route)}
      {...props}
      name={route.route}
      key={route.route}
      options={(args) => {
        // Only eager load generated components
        const staticOptions = route.generated ? route.loadRoute()?.getNavOptions : null;
        const staticResult =
          typeof staticOptions === 'function' ? staticOptions(args) : staticOptions;
        const dynamicResult = typeof options === 'function' ? options?.(args) : options;
        const output = {
          ...staticResult,
          ...dynamicResult,
        };

        // Prevent generated screens from showing up in the tab bar.
        if (route.generated) {
          output.tabBarButton = () => null;
          // TODO: React Navigation doesn't provide a way to prevent rendering the drawer item.
          output.drawerItemStyle = { height: 0, display: 'none' };
        }

        return output;
      }}
      getComponent={() => getQualifiedRouteComponent(route)}
    />
  );
}
