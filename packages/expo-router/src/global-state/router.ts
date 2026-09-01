import * as Linking from 'expo-linking';
import { IS_DOM } from 'expo/dom';
import { Platform } from 'react-native';

import {
  emitDomDismiss,
  emitDomDismissAll,
  emitDomGoBack,
  emitDomLinkEvent,
  emitDomSetParams,
} from '../domComponents/emitDomEvent';
import { resolveHref } from '../link/href';
import type { Href, RoutePath, RouteInputParams } from '../types';
import { shouldLinkExternally } from '../utils/url';
import { navigationRef } from './navigationRef';
import type { RoutingIntent } from './routingQueue';
import type { LinkToOptions, NavigationOptions } from './types';

function assertIsReady() {
  // TODO(@ubax): check whether this is still needed
  if (!navigationRef.isReady()) {
    throw new Error(
      'Attempted to navigate before mounting the Root Layout component. Ensure the Root Layout component is rendering a Slot, or other navigator on the first render.'
    );
  }
}

function navigateImpl(
  enqueue: (intent: RoutingIntent) => void,
  url: Href,
  options?: NavigationOptions
) {
  return linkToImpl(enqueue, resolveHref(url), { ...options, event: 'NAVIGATE' });
}

export function reload() {
  // TODO(EvanBacon): add `reload` support.
  throw new Error('The reload method is not implemented in the client-side router yet.');
}

function prefetchImpl(
  enqueue: (intent: RoutingIntent) => void,
  href: Href,
  options?: NavigationOptions
) {
  return linkToImpl(enqueue, resolveHref(href), { ...options, event: 'PRELOAD' });
}

function pushImpl(
  enqueue: (intent: RoutingIntent) => void,
  url: Href,
  options?: NavigationOptions
) {
  return linkToImpl(enqueue, resolveHref(url), { ...options, event: 'PUSH' });
}

// `GO_BACK` follows focused back handling; `POP` explicitly removes stack routes.
function dismissImpl(enqueue: (intent: RoutingIntent) => void, count: number = 1) {
  if (emitDomDismiss(count)) {
    return;
  }

  enqueue({
    type: 'ACTION',
    payload: { action: { type: 'POP', payload: { count } } },
  });
}

function dismissToImpl(
  enqueue: (intent: RoutingIntent) => void,
  href: Href,
  options?: NavigationOptions
) {
  return linkToImpl(enqueue, resolveHref(href), { ...options, event: 'POP_TO' });
}

function replaceImpl(
  enqueue: (intent: RoutingIntent) => void,
  url: Href,
  options?: NavigationOptions
) {
  return linkToImpl(enqueue, resolveHref(url), { ...options, event: 'REPLACE' });
}

function dismissAllImpl(enqueue: (intent: RoutingIntent) => void) {
  if (emitDomDismissAll()) {
    return;
  }
  enqueue({ type: 'ACTION', payload: { action: { type: 'POP_TO_TOP' } } });
}

// `GO_BACK` follows focused back handling; `POP` (used by `dismiss`) explicitly removes stack routes.
function goBackImpl(enqueue: (intent: RoutingIntent) => void) {
  if (emitDomGoBack()) {
    return;
  }
  enqueue({ type: 'ACTION', payload: { action: { type: 'GO_BACK' } } });
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
  // TODO(@ubax): check whether this is still needed
  if (!navigationRef.isReady()) {
    return false;
  }
  return navigationRef.current?.canGoBack() ?? false;
}

export function canDismiss(): boolean {
  if (IS_DOM) {
    throw new Error(
      'canDismiss imperative method is not supported. Pass the property to the DOM component instead.'
    );
  }
  // TODO(@ubax): check whether this is still needed
  if (!navigationRef.isReady()) {
    return false;
  }
  return navigationRef.current?.canDismiss() ?? false;
}

export function setParams(
  params: Record<string, undefined | string | number | (string | number)[]> = {}
) {
  if (emitDomSetParams(params)) {
    return;
  }
  assertIsReady();
  return (navigationRef.current?.setParams as any)(params);
}

function linkToImpl(
  enqueue: (intent: RoutingIntent) => void,
  originalHref: Href | string,
  options: LinkToOptions = {}
) {
  let href: string | undefined | null =
    typeof originalHref == 'string' ? originalHref : resolveHref(originalHref);

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
    return goBackImpl(enqueue);
  }

  // TODO(@ubax): Extract this change to standalone PR
  const linkAction = {
    type: 'NAVIGATE_TO_HREF' as const,
    payload: {
      href,
      options,
    },
  };

  enqueue(linkAction);
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
export type ImperativeRouter = {
  /**
   * Goes back in the navigation history.
   */
  back: () => void;
  /**
   * Navigates to a route in the navigator's history if it supports invoking the `back` function.
   */
  canGoBack: () => boolean;
  /**
   * Navigates to the provided [`href`](#hreft) using a push operation if possible.
   */
  push: (href: Href, options?: NavigationOptions) => void;
  /**
   * Navigates to the provided [`href`](#hreft).
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
   * Navigates to a stack lower than the current screen using the provided count if possible, otherwise 1.
   *
   * If the current screen is the only route, it will dismiss the entire stack.
   */
  dismiss: (count?: number) => void;
  /**
   * Dismisses screens until the provided href is reached. If the href is not found, it will instead replace the current screen with the provided `href`.
   */
  dismissTo: (href: Href, options?: NavigationOptions) => void;
  /**
   * Returns to the first screen of the closest stack — equivalent to a stack
   * `popToTop` action.
   *
   * @see React Navigation's [`popToTop`](https://reactnavigation.org/docs/stack-actions/#poptotop)
   * stack action for the underlying behavior.
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
  setParams: <T extends RoutePath>(params: Partial<RouteInputParams<T>>) => void;
  /**
   * Reloads the currently mounted route in experimental server mode. This can be used to re-fetch data.
   * @hidden
   */
  reload: () => void;
  /**
   * Prefetch a screen in the background before navigating to it
   */
  prefetch: (href: Href, options?: NavigationOptions) => void;
};

/**
 * @hidden
 */
type InternalRouter = ImperativeRouter & {
  goBack: () => void;
  linkTo: (href: Href | string, options?: LinkToOptions) => void;
};

export function createImperativeRouter(enqueue: (intent: RoutingIntent) => void): InternalRouter {
  return {
    navigate: (href, options) => navigateImpl(enqueue, href, options),
    push: (href, options) => pushImpl(enqueue, href, options),
    dismiss: (count) => dismissImpl(enqueue, count),
    dismissAll: () => dismissAllImpl(enqueue),
    dismissTo: (href, options) => dismissToImpl(enqueue, href, options),
    canDismiss,
    replace: (href, options) => replaceImpl(enqueue, href, options),
    back: () => goBackImpl(enqueue),
    goBack: () => goBackImpl(enqueue),
    canGoBack,
    reload,
    prefetch: (href, options) => prefetchImpl(enqueue, href, options),
    setParams: setParams as ImperativeRouter['setParams'],
    linkTo: (href, options) => linkToImpl(enqueue, href, options),
  };
}

const throwBeforeFirstRender = () => {
  throw new Error('The imperative router is unavailable before the first render has finished.');
};

export const unboundRouter: InternalRouter = {
  navigate: throwBeforeFirstRender,
  push: throwBeforeFirstRender,
  dismiss: throwBeforeFirstRender,
  dismissAll: throwBeforeFirstRender,
  dismissTo: throwBeforeFirstRender,
  canDismiss: throwBeforeFirstRender,
  replace: throwBeforeFirstRender,
  back: throwBeforeFirstRender,
  goBack: throwBeforeFirstRender,
  canGoBack: throwBeforeFirstRender,
  reload: throwBeforeFirstRender,
  prefetch: throwBeforeFirstRender,
  setParams: throwBeforeFirstRender,
  linkTo: throwBeforeFirstRender,
};

export const router: InternalRouter = { ...unboundRouter };

export const navigate = (...args: Parameters<InternalRouter['navigate']>) =>
  router.navigate(...args);
export const push = (...args: Parameters<InternalRouter['push']>) => router.push(...args);
export const dismiss = (...args: Parameters<InternalRouter['dismiss']>) => router.dismiss(...args);
export const dismissAll = () => router.dismissAll();
export const dismissTo = (...args: Parameters<InternalRouter['dismissTo']>) =>
  router.dismissTo(...args);
export const replace = (...args: Parameters<InternalRouter['replace']>) => router.replace(...args);
export const goBack = () => router.goBack();
export const prefetch = (...args: Parameters<InternalRouter['prefetch']>) =>
  router.prefetch(...args);
export const linkTo = (...args: Parameters<InternalRouter['linkTo']>) => router.linkTo(...args);
