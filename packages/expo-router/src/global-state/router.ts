import { IS_DOM } from 'expo/dom';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { routingQueue } from './routingQueue';
import { store } from './store';
import type { LinkToOptions, NavigationOptions } from './types';
import {
  emitDomDismiss,
  emitDomDismissAll,
  emitDomGoBack,
  emitDomLinkEvent,
  emitDomSetParams,
} from '../domComponents/emitDomEvent';
import { resolveHref } from '../link/href';
import { Href, Route, RouteInputParams } from '../types';
import { shouldLinkExternally } from '../utils/url';

export function navigate(url: Href, options?: NavigationOptions) {
  return linkTo(resolveHref(url), { ...options, event: 'NAVIGATE' });
}

export function reload() {
  // TODO(EvanBacon): add `reload` support.
  throw new Error('The reload method is not implemented in the client-side router yet.');
}

export function prefetch(href: Href, options?: NavigationOptions) {
  return linkTo(resolveHref(href), { ...options, event: 'PRELOAD' });
}

export function push(url: Href, options?: NavigationOptions) {
  return linkTo(resolveHref(url), { ...options, event: 'PUSH' });
}

export function dismiss(count: number = 1) {
  if (emitDomDismiss(count)) {
    return;
  }

  routingQueue.add({ type: 'POP', payload: { count } });
}

export function dismissTo(href: Href, options?: NavigationOptions) {
  return linkTo(resolveHref(href), { ...options, event: 'POP_TO' });
}

export function replace(url: Href, options?: NavigationOptions) {
  return linkTo(resolveHref(url), { ...options, event: 'REPLACE' });
}

export function dismissAll() {
  if (emitDomDismissAll()) {
    return;
  }
  routingQueue.add({ type: 'POP_TO_TOP' });
}

export function goBack() {
  if (emitDomGoBack()) {
    return;
  }
  store.assertIsReady();
  routingQueue.add({ type: 'GO_BACK' });
}

export function canGoBack(): boolean {
  if (IS_DOM) {
    throw new Error(
      'canGoBack imperative method is not supported. Pass the property to the DOM component instead.'
    );
  }
  // Return a default value here if the navigation hasn't mounted yet.
  // This can happen if the user calls `canGoBack` from the Root Layout route
  // before mounting a navigator. This behavior exists due to React Navigation being dynamically
  // constructed at runtime. We can get rid of this in the future if we use
  // the static configuration internally.
  if (!store.navigationRef.isReady()) {
    return false;
  }
  return store.navigationRef?.current?.canGoBack() ?? false;
}

export function canDismiss(): boolean {
  if (IS_DOM) {
    throw new Error(
      'canDismiss imperative method is not supported. Pass the property to the DOM component instead.'
    );
  }
  let state = store.state;

  // Keep traversing down the state tree until we find a stack navigator that we can pop
  while (state) {
    if (state.type === 'stack' && state.routes.length > 1) {
      return true;
    }
    if (state.index === undefined) return false;

    state = state.routes?.[state.index]?.state as any;
  }

  return false;
}

export function setParams(
  params: Record<string, undefined | string | number | (string | number)[]> = {}
) {
  if (emitDomSetParams(params)) {
    return;
  }
  store.assertIsReady();
  return (store.navigationRef?.current?.setParams as any)(params);
}

export function linkTo(originalHref: Href, options: LinkToOptions = {}) {
  originalHref = typeof originalHref == 'string' ? originalHref : resolveHref(originalHref);
  let href: string | undefined | null = originalHref;

  if (emitDomLinkEvent(href, options)) {
    return;
  }

  if (shouldLinkExternally(href)) {
    if (href.startsWith('//') && Platform.OS !== 'web') {
      href = `https:${href}`;
    }

    Linking.openURL(href);
    return;
  }

  if (href === '..' || href === '../') {
    store.assertIsReady();
    const navigationRef = store.navigationRef.current;

    if (navigationRef == null) {
      throw new Error(
        "Couldn't find a navigation object. Is your component inside NavigationContainer?"
      );
    }

    if (!store.linking) {
      throw new Error('Attempted to link to route when no routes are present');
    }

    navigationRef.goBack();
    return;
  }

  const linkAction = {
    type: 'ROUTER_LINK' as const,
    payload: {
      href,
      options,
    },
  };

  routingQueue.add(linkAction);
}

/**
 * Returns `router` object for imperative navigation API.
 *
 * @example
 *```tsx
 * import { router } from 'expo-router';
 * import { Text } from 'react-native';
 *
 * export default function Route() {
 *
 *  return (
 *   <Text onPress={() => router.push('/home')}>Go Home</Text>
 *  );
 *}
 * ```
 */
export type Router = {
  /**
   * Goes back in the navigation history.
   */
  back: () => void;
  /**
   * Navigates to a route in the navigator's history if it supports invoking the `back` function.
   */
  canGoBack: () => boolean;
  /**
   * Navigates to the provided [`href`](#href) using a push operation if possible.
   */
  push: (href: Href, options?: NavigationOptions) => void;
  /**
   * Navigates to the provided [`href`](#href).
   */
  navigate: (href: Href, options?: NavigationOptions) => void;
  /**
   * Navigates to route without appending to the history. Can be used with
   * [`useFocusEffect`](#usefocuseffecteffect-do_not_pass_a_second_prop)
   * to redirect imperatively to a new screen.
   *
   * @see [Using `useRouter()` hook](/router/reference/redirects/) to redirect.
   * */
  replace: (href: Href, options?: NavigationOptions) => void;
  /**
   * Navigates to the a stack lower than the current screen using the provided count if possible, otherwise 1.
   *
   * If the current screen is the only route, it will dismiss the entire stack.
   */
  dismiss: (count?: number) => void;
  /**
   * Dismisses screens until the provided href is reached. If the href is not found, it will instead replace the current screen with the provided `href`.
   */
  dismissTo: (href: Href, options?: NavigationOptions) => void;
  /**
   * Returns to the first screen in the closest stack. This is similar to
   * [`popToTop`](https://reactnavigation.org/docs/stack-actions/#poptotop) stack action.
   */
  dismissAll: () => void;
  /**
   * Checks if it is possible to dismiss the current screen. Returns `true` if the
   * router is within the stack with more than one screen in stack's history.
   *
   */
  canDismiss: () => boolean;
  /**
   * Updates the current route's query params.
   */
  setParams: <T extends Route>(params: Partial<RouteInputParams<T>>) => void;
  /**
   * Reloads the currently mounted route in experimental server mode. This can be used to re-fetch data.
   * @hidden
   */
  reload: () => void;
  /**
   * Prefetch a screen in the background before navigating to it
   */
  prefetch: (name: Href) => void;
};

/**
 * @hidden
 */
export const router: Router = {
  navigate,
  push,
  dismiss,
  dismissAll,
  dismissTo,
  canDismiss,
  replace,
  back: () => goBack(),
  canGoBack,
  reload,
  prefetch,
  setParams: setParams as Router['setParams'],
};
