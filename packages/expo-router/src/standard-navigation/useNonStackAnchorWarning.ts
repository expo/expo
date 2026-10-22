import { useEffect } from 'react';

import { type RouteNode, useRouteNode } from '../Route';
import type { TabRouterOptions } from '../react-navigation/native';
import { getValidInitialRouteName } from '../routeNode';

const layoutsWarnedAboutAnchor = new WeakSet<RouteNode>();

/**
 * Warns once per layout when a non-stack navigator's layout sets an anchor, but its
 * `backBehavior` is not `initialRoute`.
 */
export const useNonStackAnchorWarning = __DEV__
  ? function useNonStackAnchorWarning(
      // Tab and drawer routers default to `firstRoute`.
      backBehavior: TabRouterOptions['backBehavior'] = 'firstRoute'
    ) {
      const routeNode = useRouteNode();

      useEffect(() => {
        if (!routeNode || backBehavior === 'initialRoute') {
          return;
        }
        const anchor = getValidInitialRouteName(routeNode);
        if (anchor !== undefined && !layoutsWarnedAboutAnchor.has(routeNode)) {
          layoutsWarnedAboutAnchor.add(routeNode);
          console.warn(
            `The navigator at "${routeNode.contextKey}" sets the anchor "${anchor}", but its \`backBehavior\` is "${backBehavior}". Non-stack navigators go back to the anchor only when \`backBehavior\` is "initialRoute". Set \`backBehavior\` to "initialRoute", or remove the anchor.`
          );
        }
      }, [routeNode, backBehavior]);
    }
  : (_backBehavior?: TabRouterOptions['backBehavior']) => {};
