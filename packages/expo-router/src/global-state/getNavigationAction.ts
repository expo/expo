import type { ExpoLinkingOptions } from '../getLinkingConfig';
import { applyRedirects } from '../getRoutesRedirects';
import { resolveHrefStringWithSegments } from '../link/href';
import {
  appendInternalExpoRouterParams,
  INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME,
  INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME,
  type InternalExpoRouterParams,
} from '../navigationParams';
import type { NavigationContainerRefWithCurrent } from '../react-navigation/native';
import type { SingularOptions } from '../useScreens';
import type { UrlObject } from './getRouteInfoFromState';
import { findDivergentState, getPayloadFromStateRoute } from './stateUtils';
import { store } from './store';
import type { LinkToOptions, StoreRedirects } from './types';

export type NavigationActionContext = {
  navigationRef: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;
  linking: ExpoLinkingOptions | undefined;
  redirects: StoreRedirects[];
  getRouteInfo: () => UrlObject;
};

export function getNavigateAction(
  context: NavigationActionContext,
  baseHref: string,
  options?: LinkToOptions,
  type?: string,
  withAnchor?: boolean,
  singular?: SingularOptions,
  isPreviewNavigation?: boolean
): any;
export function getNavigateAction(
  baseHref: string,
  options?: LinkToOptions,
  type?: string,
  withAnchor?: boolean,
  singular?: SingularOptions,
  isPreviewNavigation?: boolean
): any;
export function getNavigateAction(...args: any[]) {
  const [contextOrBaseHref, baseHrefOrOptions, ...rest] = args as [
    NavigationActionContext | string,
    string | LinkToOptions,
    ...any[],
  ];
  let [options, type = 'NAVIGATE', withAnchor, singular, isPreviewNavigation] = rest as [
    LinkToOptions | undefined,
    string | undefined,
    boolean | undefined,
    SingularOptions | undefined,
    boolean | undefined,
  ];
  const context =
    typeof contextOrBaseHref === 'string'
      ? {
          navigationRef: store.navigationRef,
          linking: store.linking,
          redirects: store.redirects,
          getRouteInfo: store.getRouteInfo,
        }
      : contextOrBaseHref;
  const baseHref =
    typeof contextOrBaseHref === 'string' ? contextOrBaseHref : (baseHrefOrOptions as string);
  if (typeof contextOrBaseHref === 'string') {
    [type = 'NAVIGATE', withAnchor, singular, isPreviewNavigation] = rest as [
      string | undefined,
      boolean | undefined,
      SingularOptions | undefined,
      boolean | undefined,
    ];
    options = baseHrefOrOptions as LinkToOptions;
  }
  let href: string | undefined = baseHref;
  if (!context.navigationRef.isReady()) {
    throw new Error(
      'Attempted to navigate before mounting the Root Layout component. Ensure the Root Layout component is rendering a Slot, or other navigator on the first render.'
    );
  }
  const navigationRef = context.navigationRef.current;

  if (navigationRef == null) {
    throw new Error(
      "Couldn't find a navigation object. Is your component inside NavigationContainer?"
    );
  }
  if (!context.linking) {
    throw new Error('Attempted to link to route when no routes are present');
  }
  const rootState = navigationRef.getRootState();

  // Resolve and parse with the same route snapshot so relative paths use consistent segments.
  const routeInfo = context.getRouteInfo();
  href = resolveHrefStringWithSegments(href, routeInfo, options);
  href = applyRedirects(href, context.redirects) ?? undefined;

  // If the href is undefined, it means that the redirect has already been handled by the navigation
  if (!href) {
    return;
  }

  const state = context.linking.getStateFromPath!(href, context.linking.config, routeInfo.segments);

  if (!state || state.routes.length === 0) {
    console.error('Could not generate a valid navigation state for the given path: ' + href);
    return;
  }
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

  const { actionStateRoute, navigationState } = findDivergentState(
    state,
    rootState,
    type === 'PRELOAD'
  );

  /*
   * We found the target navigator, but the payload is in the incorrect format
   * We need to convert the action state to a payload that can be dispatched
   */
  const rootPayload = getPayloadFromStateRoute(actionStateRoute || {});

  if (withAnchor) {
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
    // Set initial on root and all nested params so anchors are loaded at every level
    let currentParams = rootPayload.params;
    while (currentParams) {
      currentParams.initial = !withAnchor;
      currentParams = currentParams.params;
    }
  }

  const expoParams: InternalExpoRouterParams = isPreviewNavigation
    ? {
        [INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME]: true,
        [INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME]: true,
      }
    : {};
  const params = appendInternalExpoRouterParams(rootPayload.params, expoParams);

  return {
    type,
    target: navigationState.key,
    payload: {
      // key: rootPayload.key,
      name: rootPayload.screen,
      params,
      singular,
    },
  };
}
