import { useEffect } from 'react';

import { type RouteNode, useRouteNode } from '../Route';
import { getValidInitialRouteName } from '../routeNode';

const layoutsWarnedAboutAnchor = new WeakSet<RouteNode>();

/** Warns once per layout when a non-stack navigator's layout sets an anchor. */
export function useNonStackAnchorWarning() {
  const routeNode = useRouteNode();

  useEffect(() => {
    if (!__DEV__ || !routeNode) {
      return;
    }
    const anchor = getValidInitialRouteName(routeNode);
    if (anchor !== undefined && !layoutsWarnedAboutAnchor.has(routeNode)) {
      layoutsWarnedAboutAnchor.add(routeNode);
      console.warn(
        `The navigator at "${routeNode.contextKey}" sets the anchor "${anchor}". Anchors in non-stack navigators are not fully supported and may be removed in a future release.`
      );
    }
  }, [routeNode]);
}
