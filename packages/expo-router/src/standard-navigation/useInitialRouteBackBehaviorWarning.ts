import { useEffect } from 'react';

import { type RouteNode, useRouteNode } from '../Route';
import type { TabRouterOptions } from '../react-navigation/native';

const layoutsWarnedAboutBackBehavior = new WeakSet<RouteNode>();

/**
 * Warns once per layout when the layout sets `backBehavior: 'initialRoute'` without
 * `backBehaviorInitialRoute`. Pass the props the layout set, not the navigator defaults.
 */
export function useInitialRouteBackBehaviorWarning({
  backBehavior,
  backBehaviorInitialRoute,
}: Pick<TabRouterOptions, 'backBehavior' | 'backBehaviorInitialRoute'>) {
  const routeNode = useRouteNode();

  useEffect(() => {
    if (
      !__DEV__ ||
      !routeNode ||
      backBehavior !== 'initialRoute' ||
      backBehaviorInitialRoute !== undefined ||
      layoutsWarnedAboutBackBehavior.has(routeNode)
    ) {
      return;
    }
    layoutsWarnedAboutBackBehavior.add(routeNode);
    console.warn(
      `The navigator at "${routeNode.contextKey}" sets \`backBehavior: 'initialRoute'\` without \`backBehaviorInitialRoute\`. Going back returns to the layout anchor, or to the first route when the layout has no anchor. Set \`backBehaviorInitialRoute\` to the name of the route that going back should return to.`
    );
  }, [routeNode, backBehavior, backBehaviorInitialRoute]);
}
