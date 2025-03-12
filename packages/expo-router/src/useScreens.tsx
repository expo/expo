'use client';

import type {
  EventMapBase,
  NavigationState,
  ParamListBase,
  RouteConfig,
  RouteProp,
  ScreenListeners,
} from '@react-navigation/native';
import React from 'react';

import { DynamicConvention, LoadedRoute, Route, RouteNode } from './Route';
import EXPO_ROUTER_IMPORT_MODE from './import-mode';
import { Screen } from './primitives';
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
};

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

  return { default: component.default };
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

  let ScreenComponent: React.ForwardRefExoticComponent<React.RefAttributes<unknown>>;

  // TODO: This ensures sync doesn't use React.lazy, but it's not ideal.
  if (EXPO_ROUTER_IMPORT_MODE === 'lazy') {
    ScreenComponent = React.lazy(async () => {
      const res = value.loadRoute();
      return fromLoadedRoute(res) as Promise<{
        default: React.ComponentType<any>;
      }>;
    });
  } else {
    const res = value.loadRoute();
    const Component = fromImport(res).default as React.ComponentType<any>;
    ScreenComponent = React.forwardRef((props, ref) => {
      return <Component {...props} ref={ref} />;
    });
  }

  const getLoadable = (props: any, ref: any) => (
    <React.Suspense fallback={<SuspenseFallback route={value} />}>
      <ScreenComponent
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

      return (
        <Route node={value} route={route}>
          {loadable}
        </Route>
      );
    }
  );

  QualifiedRoute.displayName = `Route(${value.route})`;

  qualifiedStore.set(value, QualifiedRoute);
  return QualifiedRoute;
}

/**
 * @param getId Override that will be wrapped to remove __EXPO_ROUTER_key which is added by PUSH
 * @returns a function which provides a screen id that matches the dynamic route name in params. */
export function createGetIdForRoute(
  route: Pick<RouteNode, 'dynamic' | 'route' | 'contextKey' | 'children'>,
  getId: ScreenProps['getId']
): ScreenProps['getId'] {
  const include = new Map<string, DynamicConvention>();

  if (route.dynamic) {
    for (const segment of route.dynamic) {
      include.set(segment.name, segment);
    }
  }

  return (options = {}) => {
    const { params = {} } = options;
    if (params.__EXPO_ROUTER_key) {
      const key = params.__EXPO_ROUTER_key;
      delete params.__EXPO_ROUTER_key;
      if (getId == null) {
        return key;
      }
    }

    if (getId != null) {
      return getId(options);
    }

    const segments: string[] = [];

    for (const dynamic of include.values()) {
      const value = params?.[dynamic.name];
      if (Array.isArray(value) && value.length > 0) {
        // If we are an array with a value
        segments.push(value.join('/'));
      } else if (value && !Array.isArray(value)) {
        // If we have a value and not an empty array
        segments.push(value);
      } else if (dynamic.deep) {
        segments.push(`[...${dynamic.name}]`);
      } else {
        segments.push(`[${dynamic.name}]`);
      }
    }

    return segments.join('/') ?? route.contextKey;
  };
}

export function screenOptionsFactory(
  route: RouteNode,
  options?: ScreenProps['options']
): RouteConfig<any, any, any, any, any, any>['options'] {
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
    if (route.generated) {
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
      getId={createGetIdForRoute(route, getId)}
      name={route.route}
      key={route.route}
      options={screenOptionsFactory(route, options)}
      getComponent={() => getQualifiedRouteComponent(route)}
    />
  );
}
