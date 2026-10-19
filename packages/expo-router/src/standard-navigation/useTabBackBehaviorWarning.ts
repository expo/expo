'use client';

import { useEffect } from 'react';

import { useRouteNode } from '../Route';
import type { TabRouterOptions } from '../react-navigation/native';
import { getValidInitialRouteName } from '../routeNode';

export function useTabBackBehaviorWarning(backBehavior: TabRouterOptions['backBehavior']) {
  const routeNode = useRouteNode();
  const anchor = getValidInitialRouteName(routeNode);
  const contextKey = routeNode?.contextKey;

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && backBehavior === 'none' && anchor !== undefined) {
      console.warn(
        `Layout "${contextKey}" sets both \`unstable_settings.anchor\` and \`backBehavior="none"\`, ` +
          'so `useCanGoBack()` can return `true` on the first render. ' +
          'Remove the anchor or use a different `backBehavior`.'
      );
    }
  }, [anchor, backBehavior, contextKey]);
}
