import type { RouteNode } from '../Route';
import type { ScreenProps } from '../useScreens';
import { getRouteNodeHrefMap } from '../views/useSitemap';

// Attach each file-based screen's compiled href to its options as `unstable_preloadHref`, so the
// navigator's preload dispatch can compile the route's full subtree (see `usePreloadRoutes`) instead
// of inserting a bare route that would mount its nested navigator uncommitted. Mirrors the href
// resolution `TabsClient` already does for tab-bar first-visit navigation. The href is keyed by the
// route NAME, so it attaches regardless of whether `options` is an object or a function (a function
// is wrapped so a nested navigator behind dynamic options still preloads with its subtree).
export function attachPreloadHrefs(screens: ScreenProps[], node: RouteNode | null): ScreenProps[] {
  const hrefMap = node ? getRouteNodeHrefMap() : undefined;

  if (hrefMap == null || node == null) {
    return screens;
  }

  return screens.map((screen) => {
    const child = node.children.find((candidate) => candidate.route === screen.name);
    const href = child ? hrefMap.get(child) : undefined;

    if (href == null) {
      return screen;
    }

    const { options } = screen;

    if (typeof options === 'function') {
      return {
        ...screen,
        options: (args: any) => ({ ...options(args), unstable_preloadHref: href }),
      };
    }

    return { ...screen, options: { ...options, unstable_preloadHref: href } };
  });
}
