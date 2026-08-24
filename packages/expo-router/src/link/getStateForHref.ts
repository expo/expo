import type { UrlObject } from '../global-state/getRouteInfoFromState';
import { store } from '../global-state/router-store';
import type { LinkToOptions } from '../global-state/types';
import type { Href } from '../types';
import { resolveHref, resolveHrefStringWithSegments } from './href';
import { getStateFromPath } from './linking';

export function getStateForHref(
  href: Href | string,
  routeInfo: Pick<UrlObject, 'segments'>,
  options?: LinkToOptions
) {
  href = resolveHref(href);
  href = resolveHrefStringWithSegments(href, routeInfo, options);
  return store.linking
    ? getStateFromPath(href, store.linking.config, routeInfo.segments)
    : undefined;
}
