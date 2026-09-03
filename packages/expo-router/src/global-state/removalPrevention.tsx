'use client';

import * as React from 'react';
import { createContext, use, useMemo, useState, type PropsWithChildren } from 'react';

import { useClientLayoutEffect } from '../react-navigation/core/useClientLayoutEffect';
import type { NavigationAction, NavigationState, PartialState } from '../react-navigation/routers';

type RemovalEventType = 'removePrevented' | 'removed';
type RemovalEventEmitter = (type: RemovalEventType, action: NavigationAction) => void;
type RouteRemovalEventEmitter = (
  routeKey: string,
  type: RemovalEventType,
  action: NavigationAction
) => void;
type RemovalEventEmitterRegistry = {
  registerRouteEmitter: (routeKey: string, emitter: RemovalEventEmitter) => void;
  unregisterRouteEmitter: (routeKey: string, emitter: RemovalEventEmitter) => void;
  emitRemovalEvent: (routeKey: string, type: RemovalEventType, action: NavigationAction) => void;
};

/** Provides the route keys that currently prevent removal across the navigation tree. */
export const GlobalRoutesWithRemovalPreventedContext = createContext<
  ReadonlySet<string> | undefined
>(undefined);

/** Publishes whether a route currently prevents removal. */
const GlobalRouteRemovalPreventionSetterContext = createContext<
  ((routeKey: string, id: string, isPrevented: boolean) => void) | null
>(null);

/** Registers route emitters and delivers their post-commit removal events. */
export const GlobalRemovalEventEmitterRegistryContext =
  createContext<RemovalEventEmitterRegistry | null>(null);

/** Registers independent prevention requests with the nearest route provider. */
export const ScreenRemovalPreventionSetterContext = createContext<
  ((id: string, isPrevented: boolean) => void) | undefined
>(undefined);

function RemovalEventEmitterRegistryProvider({ children }: PropsWithChildren) {
  const emitters = React.useRef(new Map<string, RemovalEventEmitter>());
  const emitterRegistry = useMemo<RemovalEventEmitterRegistry>(
    () => ({
      registerRouteEmitter(routeKey, emitter) {
        emitters.current.set(routeKey, emitter);
      },
      unregisterRouteEmitter(routeKey, emitter) {
        // Route providers unmount before post-commit `removed` delivery. Keep this emitter through
        // the current task, unless another provider has already registered for the same route.
        queueMicrotask(() => {
          if (emitters.current.get(routeKey) === emitter) {
            emitters.current.delete(routeKey);
          }
        });
      },
      emitRemovalEvent(routeKey, type, action) {
        emitters.current.get(routeKey)?.(type, action);
      },
    }),
    []
  );

  return (
    <GlobalRemovalEventEmitterRegistryContext.Provider value={emitterRegistry}>
      {children}
    </GlobalRemovalEventEmitterRegistryContext.Provider>
  );
}

function RoutesWithRemovalPreventedProvider({ children }: PropsWithChildren) {
  const [preventedRoutes, setPreventedRoutes] = useState<ReadonlyMap<string, ReadonlySet<string>>>(
    () => new Map()
  );
  const preventionSetter = React.useCallback(
    (routeKey: string, id: string, isPrevented: boolean) => {
      setPreventedRoutes((previous) => {
        const previousIds = previous.get(routeKey) ?? new Set();
        if (previousIds.has(id) === isPrevented) {
          return previous;
        }
        const nextIds = new Set(previousIds);
        if (isPrevented) {
          nextIds.add(id);
        } else {
          nextIds.delete(id);
        }
        const next = new Map(previous);
        if (nextIds.size > 0) {
          next.set(routeKey, nextIds);
        } else {
          next.delete(routeKey);
        }
        return next;
      });
    },
    []
  );
  const preventedRouteKeys = useMemo(() => new Set(preventedRoutes.keys()), [preventedRoutes]);

  return (
    <GlobalRouteRemovalPreventionSetterContext.Provider value={preventionSetter}>
      <GlobalRoutesWithRemovalPreventedContext.Provider value={preventedRouteKeys}>
        {children}
      </GlobalRoutesWithRemovalPreventedContext.Provider>
    </GlobalRouteRemovalPreventionSetterContext.Provider>
  );
}

/** Owns the global prevented-route list and route removal-event registry. */
export function RemovalPreventionProvider({ children }: PropsWithChildren) {
  return (
    <RemovalEventEmitterRegistryProvider>
      <RoutesWithRemovalPreventedProvider>{children}</RoutesWithRemovalPreventedProvider>
    </RemovalEventEmitterRegistryProvider>
  );
}

function useRegisterRouteEmitter(routeKey: string, emitRemovalEvent?: RouteRemovalEventEmitter) {
  const emitterRegistry = use(GlobalRemovalEventEmitterRegistryContext);
  const routeEmitter = React.useCallback<RemovalEventEmitter>(
    (type, action) => emitRemovalEvent?.(routeKey, type, action),
    [emitRemovalEvent, routeKey]
  );

  useClientLayoutEffect(() => {
    if (!emitRemovalEvent || !emitterRegistry) {
      return;
    }
    emitterRegistry.registerRouteEmitter(routeKey, routeEmitter);
    return () => emitterRegistry.unregisterRouteEmitter(routeKey, routeEmitter);
  }, [emitRemovalEvent, emitterRegistry, routeEmitter, routeKey]);
}

function useRouteRemovalPreventionSetter(routeKey: string) {
  const preventionSetter = use(GlobalRouteRemovalPreventionSetterContext);
  return React.useCallback(
    (id: string, isPrevented: boolean) => preventionSetter?.(routeKey, id, isPrevented),
    [preventionSetter, routeKey]
  );
}

/** Binds prevention requests and removal events to one route. */
export function PreventRemovalProvider({
  routeKey,
  emitRemovalEvent,
  children,
}: PropsWithChildren<{
  routeKey: string;
  emitRemovalEvent?: RouteRemovalEventEmitter;
}>) {
  useRegisterRouteEmitter(routeKey, emitRemovalEvent);
  const setPrevented = useRouteRemovalPreventionSetter(routeKey);

  return (
    <ScreenRemovalPreventionSetterContext.Provider value={setPrevented}>
      {children}
    </ScreenRemovalPreventionSetterContext.Provider>
  );
}

export function useRoutesWithRemovalPrevented() {
  return use(GlobalRoutesWithRemovalPreventedContext) ?? EMPTY_SET;
}

const EMPTY_SET: ReadonlySet<string> = new Set();

export function isRouteRemovalPrevented(
  route: {
    key: string | undefined;
    state?: NavigationState | PartialState<NavigationState>;
  },
  preventedRouteKeys: ReadonlySet<string>
): boolean {
  if (route.key !== undefined && preventedRouteKeys.has(route.key)) {
    return true;
  }

  const visitState = (state: NavigationState): boolean => {
    // TODO(@ubax): Add more generic way of filtering preloaded routes
    const routes = state.type === 'stack' ? state.routes.slice(0, state.index + 1) : state.routes;
    return routes.some(
      (route) =>
        preventedRouteKeys.has(route.key) ||
        (route.state?.stale === false && visitState(route.state))
    );
  };

  return route.state?.stale === false && visitState(route.state);
}
