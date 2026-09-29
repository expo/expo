import type { ExpoLinkingOptions } from '../getLinkingConfig';
import type { UrlObject } from '../global-state/getRouteInfoFromState';
import type { LinkToOptions } from '../global-state/types';
import type { Href } from '../types';
import { resolveHref, resolveHrefStringWithSegments } from './href';

export function getStateForHref(
  href: Href | string,
  routeInfo: Pick<UrlObject, 'segments'>,
  linking: ExpoLinkingOptions | undefined,
  options?: LinkToOptions
) {
  href = resolveHref(href);
  href = resolveHrefStringWithSegments(href, routeInfo, options);
  return linking?.getStateFromPath!(href, linking.config, routeInfo.segments);
}
