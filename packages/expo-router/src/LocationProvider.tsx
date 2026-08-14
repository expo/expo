import type { State } from './fork/getPathFromState';
import { stripBaseUrl } from './fork/getStateFromPath-forks';

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
    pathname: stripBaseUrl(path, baseUrl).split('?')[0]!,
    isIndex: isIndexPath(state),
    ...getNormalizedStatePath(qualified, baseUrl),
  };
}

// Checks whether the deepest focused route is an index route.
function isIndexPath(state: State) {
  const route = state.routes[state.index ?? state.routes.length - 1];
  if (!route) {
    return false;
  } else if (route.state) {
    return isIndexPath(route.state);
  }

  if (route.name.match(/.+\/index$/)) return true;

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
    segments: stripBaseUrl(pathname!, baseUrl)
      .split('/')
      .filter((x) => !!x)
      .map(decodeURIComponent),
    // TODO: This is not efficient, we should generate based on the state instead
    // of converting to string then back to object
    params: decodeParams(params),
  };
}

// TODO: Consolidate parameter decoding across the router.
function decodeParams(params: Record<string, string>) {
  const parsed: Record<string, any> = {};

  for (const [key, value] of Object.entries(params)) {
    try {
      if (Array.isArray(value)) {
        parsed[key] = value.map((v) => decodeURIComponent(v));
      } else {
        parsed[key] = decodeURIComponent(value);
      }
    } catch {
      parsed[key] = value;
    }
  }

  return parsed;
}
