import { useEffect, useEffectEvent, useState } from 'react';

import { type RouteNode, useRouteNode } from '../Route';
import type {
  NavigationHelpers,
  ParamListBase,
  TabRouterOptions,
} from '../react-navigation/native';

const layoutsWarnedAboutBackBehavior = new WeakSet<RouteNode>();
const layoutsWarnedAboutUnknownRoute = new WeakSet<RouteNode>();

/**
 * Adds `backBehaviorInitialRoute` to the navigator history once, on mount. Warns once per layout
 * when the layout sets `backBehavior: 'initialRoute'` without it. Pass the props the layout set,
 * not the navigator defaults.
 */
export function useBackBehaviorInitialRoute({
  backBehavior,
  backBehaviorInitialRoute,
  navigation,
}: Pick<TabRouterOptions, 'backBehavior' | 'backBehaviorInitialRoute'> & {
  navigation: Pick<NavigationHelpers<ParamListBase>, 'dispatch' | 'getState'> | undefined;
}) {
  const routeNode = useRouteNode();
  const [initialRouteName] = useState(backBehaviorInitialRoute);

  const addInitialRoute = useEffectEvent((name: string) => {
    if (!navigation) {
      return;
    }
    const { key, routeNames } = navigation.getState();
    if (routeNames.includes(name)) {
      navigation.dispatch({ type: 'ADD_INITIAL_ROUTE', payload: { name }, target: key });
    } else if (__DEV__ && routeNode && !layoutsWarnedAboutUnknownRoute.has(routeNode)) {
      layoutsWarnedAboutUnknownRoute.add(routeNode);
      console.warn(
        `The navigator at "${routeNode.contextKey}" sets \`backBehaviorInitialRoute\` to "${name}", but it has no route with that name, so going back ignores it. Set \`backBehaviorInitialRoute\` to one of these routes: ${routeNames.join(', ')}.`
      );
    }
  });

  useEffect(() => {
    if (initialRouteName !== undefined) {
      addInitialRoute(initialRouteName);
    }
  }, [initialRouteName]);

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
