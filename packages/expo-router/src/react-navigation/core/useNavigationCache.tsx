'use client';
import * as React from 'react';
import { use } from 'react';

import {
  CommonActions,
  type NavigationAction,
  type NavigationState,
  type ParamListBase,
  type Router,
} from '../routers';
import { NavigationBuilderContext } from './NavigationBuilderContext';
import type { NavigationHelpers, NavigationProp } from './types';
import type { NavigationEventEmitter } from './useEventEmitter';

type Options<
  State extends NavigationState,
  ScreenOptions extends object,
  EventMap extends Record<string, any>,
> = {
  routes: State['routes'];
  routeNames: State['routeNames'];
  navigation: NavigationHelpers<ParamListBase> &
    Partial<NavigationProp<ParamListBase, string, any, any, any>>;
  setOptions: (
    cb: (options: Record<string, ScreenOptions>) => Record<string, ScreenOptions>
  ) => void;
  router: Router<State, NavigationAction>;
  emitter: NavigationEventEmitter<EventMap>;
};

type NavigationItem<
  State extends NavigationState,
  ScreenOptions extends object,
  EventMap extends Record<string, any>,
> = NavigationProp<ParamListBase, string, string | undefined, State, ScreenOptions, EventMap>;

type NavigationCache<
  State extends NavigationState,
  ScreenOptions extends object,
  EventMap extends Record<string, any>,
> = Record<string, NavigationItem<State, ScreenOptions, EventMap>>;

/**
 * Hook to cache navigation objects for each screen in the navigator.
 * It's important to cache them to make sure navigation objects don't change between renders.
 * This lets us apply optimizations like `React.memo` to minimize re-rendering screens.
 * Exception: a route's navigation object changes identity once when the route is promoted from
 * preloaded to active.
 * TODO(@ubax): consider resolving `isPreloaded` at call time to keep one object per route.
 */
export function useNavigationCache<
  State extends NavigationState,
  ScreenOptions extends object,
  EventMap extends Record<string, any>,
  ActionHelpers extends Record<string, () => void>,
>({
  routes,
  routeNames,
  navigation,
  setOptions,
  router,
  emitter,
}: Options<State, ScreenOptions, EventMap>) {
  const { stackRef } = use(NavigationBuilderContext);

  // Cache object which holds navigation objects for each screen
  // We use `React.useMemo` instead of `React.useRef` coz we want to invalidate it when deps change
  // In reality, these deps will rarely change, if ever
  const cache = React.useMemo(
    () => ({ current: {} as NavigationCache<State, ScreenOptions, EventMap> }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigation, setOptions, emitter]
  );

  // Keep name-keyed placeholders stable after their real route keys are created.
  const routeKeys = [...routes.map((route) => route.key), ...routeNames];
  const validKeys = new Set(routeKeys.flatMap((key) => [key, `p\0${key}`]));
  cache.current = Object.fromEntries(
    Object.entries(cache.current).filter(([key]) => validKeys.has(key))
  );

  const createNavigation = (route: { key: string; name: string }, isPreloaded: boolean) => {
    const dispatchSync = (action: NavigationAction) => {
      if (isPreloaded) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            `Ignored a navigation action dispatched from the preloaded screen '${route.name}'. The screen is rendered for preloading and is not focused, so its actions would unexpectedly modify the visible stack. Wait until the screen is focused before dispatching.`
          );
        }
        return;
      }

      // TODO(@ubax): https://github.com/expo/expo/pull/48618#discussion_r3735996416
      navigation.dispatchSync({ source: route.key, ...action });
    };

    const dispatch = (action: NavigationAction) => {
      if (isPreloaded) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            `Ignored a navigation action dispatched from the preloaded screen '${route.name}'. The screen is rendered for preloading and is not focused, so its actions would unexpectedly modify the visible stack. Wait until the screen is focused before dispatching.`
          );
        }
        return;
      }

      navigation.dispatch({ source: route.key, ...action });
    };

    const withStack = (callback: () => void) => {
      let isStackSet = false;

      try {
        if (process.env.NODE_ENV !== 'production' && stackRef && !stackRef.current) {
          // Capture the stack trace for devtools
          stackRef.current = new Error().stack;
          isStackSet = true;
        }

        callback();
      } finally {
        if (isStackSet && stackRef) {
          stackRef.current = undefined;
        }
      }
    };

    const actions = {
      ...router.actionCreators,
      ...CommonActions,
    };

    const helpers = Object.keys(actions).reduce<Record<string, () => void>>((acc, name) => {
      acc[name] = (...args: any) =>
        withStack(() =>
          // @ts-expect-error: name is a valid key, but TypeScript is dumb
          dispatch(actions[name](...args))
        );

      return acc;
    }, {});

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { emit, ...rest } = navigation;

    const navigationItem: NavigationItem<State, ScreenOptions, EventMap> = {
      ...rest,
      ...helpers,
      // FIXME: too much work to fix the types for now
      ...(emitter.create(route.key) as any),
      dispatch: (action: NavigationAction) => withStack(() => dispatch(action)),
      dispatchSync: (action: NavigationAction) => withStack(() => dispatchSync(action)),
      getParent: (id?: string) => {
        if (id !== undefined && id === rest.getId()) {
          // If the passed id is the same as the current navigation id,
          // we return the cached navigation object for the relevant route
          return navigationItem;
        }

        return rest.getParent(id);
      },
      setOptions: (options: object) => {
        setOptions((o) => ({
          ...o,
          [route.key]: { ...o[route.key]!, ...options },
        }));
      },
      isFocused: () => {
        const state = rest.getState();

        if (state.routes[state.index]?.key !== route.key) {
          return false;
        }

        // If the current screen is focused, we also need to check if parent navigator is focused
        // This makes sure that we return the focus state in the whole tree, not just this navigator
        return navigation ? navigation.isFocused() : true;
      },
    };

    return navigationItem;
  };

  return (route: { key: string; name: string }, isPreloaded: boolean) => {
    const key = `${isPreloaded ? 'p\0' : ''}${route.key}`;
    const cachedNavigation = cache.current[key];
    if (cachedNavigation) {
      return cachedNavigation;
    }

    const navigation = createNavigation(route, isPreloaded);
    cache.current[key] = navigation;
    return navigation;
  };
}
