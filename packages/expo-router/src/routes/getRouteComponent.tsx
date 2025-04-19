'use client';

import { useIsFocused, useStateForPath } from '@react-navigation/native';
import React from 'react';

import { LoadedRoute, Route, RouteNode } from '../Route';
import { useExpoRouterStore } from '../global-state/storeContext';
import EXPO_ROUTER_IMPORT_MODE from '../import-mode';
import { EmptyRoute } from '../views/EmptyRoute';
import { SuspenseFallback } from '../views/SuspenseFallback';
import { Try } from '../views/Try';

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

function fromLoadedRoute(value: RouteNode, res: LoadedRoute) {
  if (!(res instanceof Promise)) {
    return fromImport(value, res);
  }

  return res.then(fromImport.bind(null, value));
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
