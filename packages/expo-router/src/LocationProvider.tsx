import { decodeParams, type State } from './fork/getPathFromState';
import { stripBaseUrl } from './fork/getStateFromPath';

type SearchParams = Record<string, string | string[]>;

export type UrlObject = {
  unstable_globalHref: string;
  pathname: string;
  readonly params: SearchParams;
  segments: string[];
  isIndex: boolean;
};

export function getRouteInfoFromState(
  getPathFromState: (state: State, asPath: boolean) => { path: string; params: any },
  state: State,
  baseUrl?: string
): UrlObject {
  const { path } = getPathFromState(state, false);
  const qualified = getPathFromState(state, true);

  return {
    // TODO: This may have a predefined origin attached in the future.
    unstable_globalHref: path,
    pathname: stripBaseUrl(path, baseUrl).split('?')['0'],
    isIndex: isIndexPath(state),
    ...getNormalizedStatePath(qualified, baseUrl),
  };
}

function isIndexPath(state: State) {
  const route = state.routes[state.index ?? state.routes.length - 1];
  if (route.state) {
    return isIndexPath(route.state);
  }

  // Index routes on the same level as a layout do not have `index` in their name
  if (route.params && 'screen' in route.params) {
    return route.params.screen === 'index';
  }

  // The `params` key will not exist if there are no params
  // So we need to do a positive lookahead to check if the route ends with /index
  // Nested routes that are hoisted will have a name ending with /index
  // e.g name could be /user/[id]/index
  if (route.name.match(/.+\/index$/)) return true;

  // The state will either have params (because there are multiple _layout) or it will be hoisted with a name
  // If we don't match the above cases, then it's not an index route

  return false;
}

// TODO: Split up getPathFromState to return all this info at once.
export function getNormalizedStatePath(
  {
    path: statePath,
    params,
  }: {
    path: string;
    params: any;
  },
  baseUrl?: string
): Pick<UrlObject, 'segments' | 'params'> {
  const [pathname] = statePath.split('?');
  return {
    // Strip empty path at the start
    segments: stripBaseUrl(pathname, baseUrl).split('/').filter(Boolean).map(decodeURIComponent),
    // TODO: This is not efficient, we should generate based on the state instead
    // of converting to string then back to object
    params: decodeParams(params),
  };
}
