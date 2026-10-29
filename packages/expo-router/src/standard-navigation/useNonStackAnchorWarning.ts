import { useRouteNode } from '../Route';
import type { TabRouterOptions } from '../react-navigation/native';
import { getValidInitialRouteName } from '../routeNode';
import { useWarnOnce } from '../useDeprecated';

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
      const anchor = getValidInitialRouteName(routeNode);
      useWarnOnce(
        `The navigator at "${routeNode?.contextKey}" sets the anchor "${anchor}", but its \`backBehavior\` is "${backBehavior}". Non-stack navigators go back to the anchor only when \`backBehavior\` is "initialRoute". Set \`backBehavior\` to "initialRoute", or remove the anchor.`,
        anchor !== undefined && backBehavior !== 'initialRoute',
        `non-stack-anchor:${routeNode?.contextKey}`
      );
    }
  : (_backBehavior?: TabRouterOptions['backBehavior']) => {};
