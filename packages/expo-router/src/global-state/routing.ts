import { NavigationAction, type NavigationState, PartialRoute } from '@react-navigation/native';
import { IS_DOM } from 'expo/dom';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { store } from './router-store';
import {
  emitDomDismiss,
  emitDomDismissAll,
  emitDomGoBack,
  emitDomLinkEvent,
  emitDomSetParams,
} from '../domComponents/emitDomEvent';
import { ResultState } from '../fork/getStateFromPath';
import { applyRedirects } from '../getRoutesRedirects';
import { resolveHref, resolveHrefStringWithSegments } from '../link/href';
import { matchDynamicName } from '../matchers';
import { Href } from '../types';
import { SingularOptions } from '../useScreens';
import { shouldLinkExternally } from '../utils/url';

function assertIsReady() {
  if (!store.navigationRef.isReady()) {
    throw new Error(
      'Attempted to navigate before mounting the Root Layout component. Ensure the Root Layout component is rendering a Slot, or other navigator on the first render.'
    );
  }
}

export const routingQueue = {
  queue: [] as NavigationAction[],
  subscribers: new Set<() => void>(),
  subscribe(callback: () => void) {
    routingQueue.subscribers.add(callback);
    return () => {
      routingQueue.subscribers.delete(callback);
    };
  },
  snapshot() {
    return routingQueue.queue;
  },
  add(action: NavigationAction) {
    // Reset the identity of the queue.
    if (routingQueue.queue.length === 0) {
      routingQueue.queue = [];
    }

    routingQueue.queue.push(action);
    for (const callback of routingQueue.subscribers) {
      callback();
    }
  },
  run() {
    const queue = routingQueue.queue;
    if (queue.length === 0 || !store.navigationRef) {
      return;
    }

    routingQueue.queue = [];
    for (const action of queue) {
      store.navigationRef.dispatch(action);
    }
  },
};

export type NavigationOptions = Omit<LinkToOptions, 'event'>;

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
  assertIsReady();
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
  assertIsReady();
  return (store.navigationRef?.current?.setParams as any)(params);
}

export type LinkToOptions = {
  event?: string;

  /**
   * Relative URL references are either relative to the directory or the document. By default, relative paths are relative to the document.
   * @see: [MDN's documentation on Resolving relative references to a URL](https://developer.mozilla.org/en-US/docs/Web/API/URL_API/Resolving_relative_references).
   */
  relativeToDirectory?: boolean;

  /**
   * Include the anchor when navigating to a new navigator
   */
  withAnchor?: boolean;

  /**
   * When navigating in a Stack, remove all screen from the history that match the singular condition
   *
   * If used with `push`, the history will be filtered even if no navigation occurs.
   */
  dangerouslySingular?: SingularOptions;
};

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

  assertIsReady();
  const navigationRef = store.navigationRef.current;

  if (navigationRef == null) {
    throw new Error(
      "Couldn't find a navigation object. Is your component inside NavigationContainer?"
    );
  }

  if (!store.linking) {
    throw new Error('Attempted to link to route when no routes are present');
  }

  if (href === '..' || href === '../') {
    navigationRef.goBack();
    return;
  }

  const rootState = navigationRef.getRootState();

  href = resolveHrefStringWithSegments(href, store.getRouteInfo(), options);
  href = applyRedirects(href, store.redirects);

  // If the href is undefined, it means that the redirect has already been handled the navigation
  if (!href) {
    return;
  }

  const state = store.linking.getStateFromPath!(href, store.linking.config);

  if (!state || state.routes.length === 0) {
    console.error('Could not generate a valid navigation state for the given path: ' + href);
    return;
  }

  routingQueue.add(
    getNavigateAction(
      state,
      rootState,
      options.event,
      options.withAnchor,
      options.dangerouslySingular
    )
  );
}

function getNavigateAction(
  actionState: ResultState,
  navigationState: NavigationState,
  type = 'NAVIGATE',
  withAnchor?: boolean,
  singular?: SingularOptions
) {
  /**
   * We need to find the deepest navigator where the action and current state diverge, If they do not diverge, the
   * lowest navigator is the target.
   *
   * By default React Navigation will target the current navigator, but this doesn't work for all actions
   * For example:
   *  - /deeply/nested/route -> /top-level-route the target needs to be the top-level navigator
   *  - /stack/nestedStack/page -> /stack1/nestedStack/other-page needs to target the nestedStack navigator
   *
   * This matching needs to done by comparing the route names and the dynamic path, for example
   * - /1/page -> /2/anotherPage needs to target the /[id] navigator
   *
   * Other parameters such as search params and hash are not evaluated.
   */
  let actionStateRoute: PartialRoute<any> | undefined;

  // Traverse the state tree comparing the current state and the action state until we find where they diverge
  while (actionState && navigationState) {
    const stateRoute = navigationState.routes[navigationState.index];

    actionStateRoute = actionState.routes[actionState.routes.length - 1];

    const childState: any = actionStateRoute.state;
    const nextNavigationState = stateRoute.state;

    const dynamicName = matchDynamicName(actionStateRoute.name);

    const didActionAndCurrentStateDiverge =
      actionStateRoute.name !== stateRoute.name ||
      !childState ||
      !nextNavigationState ||
      // @ts-expect-error: TODO(@kitten): This isn't properly typed, so the index access fails
      (dynamicName && actionStateRoute.params?.[dynamicName.name] !== stateRoute.params?.[dynamicName.name]);

    if (didActionAndCurrentStateDiverge) {
      break;
    }

    actionState = childState;
    navigationState = nextNavigationState as NavigationState;
  }

  /*
   * We found the target navigator, but the payload is in the incorrect format
   * We need to convert the action state to a payload that can be dispatched
   */
  const rootPayload: Record<string, any> = { params: {} };
  let payload = rootPayload;
  let params = payload.params;

  // The root level of payload is a bit weird, its params are in the child object
  while (actionStateRoute) {
    Object.assign(params, { ...payload.params, ...actionStateRoute.params });
    // Assign the screen name to the payload
    payload.screen = actionStateRoute.name;
    // Merge the params, ensuring that we create a new object
    payload.params = { ...params };

    // Params don't include the screen, thats a separate attribute
    delete payload.params['screen'];

    // Continue down the payload tree
    // Initially these values are separate, but React Nav merges them after the first layer
    payload = payload.params;
    params = payload;

    actionStateRoute = actionStateRoute.state?.routes[actionStateRoute.state?.routes.length - 1];
  }

  if (type === 'PUSH' && navigationState.type !== 'stack') {
    type = 'NAVIGATE';
  } else if (navigationState.type === 'expo-tab') {
    type = 'JUMP_TO';
  } else if (type === 'REPLACE' && navigationState.type === 'drawer') {
    type = 'JUMP_TO';
  }

  if (withAnchor !== undefined) {
    if (rootPayload.params.initial) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`The parameter 'initial' is a reserved parameter name in React Navigation`);
      }
    }
    /*
     * The logic for initial can seen backwards depending on your perspective
     *   True: The initialRouteName is not loaded. The incoming screen is the initial screen (default)
     *   False: The initialRouteName is loaded. THe incoming screen is placed after the initialRouteName
     *
     * withAnchor flips the perspective.
     *   True: You want the initialRouteName to load.
     *   False: You do not want the initialRouteName to load.
     */
    rootPayload.params.initial = !withAnchor;
  }

  return {
    type,
    target: navigationState.key,
    payload: {
      // key: rootPayload.key,
      name: rootPayload.screen,
      params: rootPayload.params,
      singular,
    },
  };
}
