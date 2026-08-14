import type { UrlObject } from '../LocationProvider';
import {
  findRouteNodeByName,
  getValidInitialRouteName,
  sortRoutesWithInitial,
  type RouteNode,
} from '../Route';
import { NOT_FOUND_ROUTE_NAME } from '../constants';
import { resolveNavigationDestination } from '../global-state/resolveNavigationDestination';
import type { RouterRegistry } from '../global-state/routerRegistry';
import { resolveHref, resolveHrefStringWithSegments } from '../link/href';
import type {
  LinkingOptions,
  NavigationAction,
  NavigationState,
  ParamListBase,
  PartialState,
} from '../react-navigation/native';
import type { Href } from '../types';
import { type ScreenProps, useSortedScreens } from '../useScreens';
import { Slot } from './Slot';
import type { ExpoTabActionType } from './TabRouter';

export const ViewSlot = Slot;

export type ScreenTrigger =
  | {
      type: 'internal';
      href: Href;
      name: string;
    }
  | {
      type: 'external';
      name: string;
      href: string;
    };

type JumpToNavigationAction = Extract<ExpoTabActionType, { type: 'JUMP_TO' }>;
type TriggerConfig =
  | {
      type: 'internal';
      name: string;
      href: string;
      routeNode: RouteNode;
      layoutRouteNode: RouteNode;
      contextKey: string;
      action: JumpToNavigationAction;
      targetState?: PartialState<NavigationState>;
      deep: boolean;
    }
  | { type: 'external'; name: string; href: string };

export type TriggerMap = Record<string, TriggerConfig>;

export function buildTabAction(
  config: Extract<TriggerConfig, { type: 'internal' }>,
  state: NavigationState,
  registry: RouterRegistry,
  resetOnFocus?: boolean
): NavigationAction {
  const route = state.routes.find((route) => route.name === config.routeNode.route);
  const isSwitching = state.routes[state.index]?.key !== route?.key;
  const shouldResolve =
    config.deep || route?.state === undefined || Boolean(resetOnFocus && isSwitching);
  const navigationState =
    resetOnFocus && isSwitching && route?.state
      ? {
          ...state,
          routes: state.routes.map((currentRoute) =>
            currentRoute.key === route.key ? { ...currentRoute, state: undefined } : currentRoute
          ),
        }
      : state;
  const action = {
    ...config.action,
    type: shouldResolve && !isSwitching ? 'NAVIGATE' : 'JUMP_TO',
    payload: {
      ...config.action.payload,
      ...(resetOnFocus !== undefined ? { resetOnFocus } : undefined),
    },
  };

  return shouldResolve && config.targetState
    ? (resolveNavigationDestination({
        targetState: config.targetState,
        navigationState,
        routeNode: config.layoutRouteNode,
        registry,
        action,
        // The resolver preserves the supplied action type.
      }) as NavigationAction)
    : action;
}

export function useTriggersToScreens(
  triggers: ScreenTrigger[],
  layoutRouteNode: RouteNode,
  linking: LinkingOptions<ParamListBase>,
  parentTriggerMap: TriggerMap,
  routeInfo: UrlObject,
  contextKey: string
) {
  const configs: TriggerConfig[] = [];

  for (const trigger of triggers) {
    if (trigger.name in parentTriggerMap) {
      const parentTrigger = parentTriggerMap[trigger.name]!;
      throw new Error(
        `Trigger ${JSON.stringify({
          name: trigger.name,
          href: trigger.href,
        })} has the same name as parent trigger ${JSON.stringify({
          name: parentTrigger.name,
          href: parentTrigger.href,
        })}. Triggers must have unique names.`
      );
    }

    if (trigger.type === 'external') {
      configs.push(trigger);
      continue;
    }

    let resolvedHref = resolveHref(trigger.href);

    if (resolvedHref.startsWith('../')) {
      throw new Error('Trigger href cannot link to a parent directory');
    }

    const segmentsWithoutGroups = contextKey.split('/').filter((segment) => {
      return !(segment.startsWith('(') && segment.endsWith(')'));
    });

    resolvedHref = resolveHrefStringWithSegments(
      resolvedHref,
      {
        ...routeInfo,
        segments: segmentsWithoutGroups,
      },
      { relativeToDirectory: true }
    );

    let state = linking.getStateFromPath?.(resolvedHref, linking.config)?.routes[0];

    if (!state) {
      // This shouldn't occur, as you should get the global +not-found
      console.warn(
        `Unable to find screen for trigger ${JSON.stringify(trigger)}. Does this point to a valid screen?`
      );
      continue;
    }

    let routeState = state;

    if (routeState.name === NOT_FOUND_ROUTE_NAME) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `Tab trigger '${trigger.name}' has the href '${trigger.href}' which points to a +not-found route.`
        );
      }
      continue;
    }

    const targetStateName = layoutRouteNode.route || '__root';

    // The state object is the current state from the rootNavigator
    // We need to work out the state for just this trigger
    while (state?.state) {
      if (state.name === targetStateName) break;
      state = state.state.routes[state.state.index ?? state.state.routes.length - 1]!;
    }
    const isWithinLayout = state?.name === targetStateName;
    routeState =
      state!.state?.routes[state!.state.index ?? state!.state.routes.length - 1] || state;

    const routeNode = findRouteNodeByName(layoutRouteNode, routeState?.name);

    if (!isWithinLayout) {
      throw new Error(
        `Tab trigger '${trigger.name}' with href '${resolvedHref}' must point to a route within the tabs layout.`
      );
    }

    if (!routeNode) {
      console.warn(
        `Unable to find routeNode for trigger ${JSON.stringify(trigger)}. This might be a bug with Expo Router`
      );
      continue;
    }

    const duplicateTrigger =
      trigger.type === 'internal' &&
      configs.find((config): config is Extract<TriggerConfig, { type: 'internal' }> => {
        if (config.type === 'external') {
          return false;
        }

        return config.routeNode.route === routeNode.route;
      });

    if (duplicateTrigger) {
      const duplicateTriggerText = `${JSON.stringify({ name: duplicateTrigger.name, href: duplicateTrigger.href })} and ${JSON.stringify({ name: trigger.name, href: trigger.href })}`;

      // TODO(@ubax): Support multiple triggers for one dynamic route with different params.
      throw new Error(
        `A navigator cannot contain multiple trigger components that map to the same sub-segment. Consider adding a shared group and assigning a group to each trigger. Conflicting triggers:\n\t${duplicateTriggerText}.\nBoth triggers map to route ${routeNode.route}.`
      );
    }

    const action: JumpToNavigationAction = {
      type: 'JUMP_TO',
      payload: { name: routeState.name, params: routeState.params },
    };
    configs.push({
      ...trigger,
      href: resolvedHref,
      routeNode,
      layoutRouteNode,
      contextKey,
      action,
      targetState: state.state,
      deep: hasDeepDestination(routeState, routeNode),
    });
  }

  const screenProps: ScreenProps[] = [];
  const triggerMap: TriggerMap = { ...parentTriggerMap };

  for (const config of configs) {
    triggerMap[config.name] = config;

    if (config.type === 'internal') {
      // TODO(https://github.com/expo/expo/pull/48756): Resolved internal-trigger href params need
      // to flow through ExpoTabRouter to placeholder and fallback routes, action-recreated routes,
      // and stale-state rehydration without restoring Screen.initialParams. Explicit action params
      // must override these defaults.
      screenProps.push({ name: config.routeNode.route });
    }
  }

  const children = useSortedScreens(screenProps);

  return {
    children,
    triggerMap,
  };
}

function hasDeepDestination(
  route: { state?: PartialState<NavigationState> },
  routeNode: RouteNode
) {
  let state = route.state;
  let node = routeNode;

  while (state) {
    const childRoute = state.routes[state.index ?? state.routes.length - 1];
    const initialRouteName =
      getValidInitialRouteName(node) ?? [...node.children].sort(sortRoutesWithInitial())[0]?.route;
    if (
      !childRoute ||
      childRoute.name !== initialRouteName ||
      (childRoute.params && Object.keys(childRoute.params).length > 0)
    ) {
      return true;
    }

    const childNode = findRouteNodeByName(node, childRoute.name);
    if (!childNode) {
      return true;
    }
    node = childNode;
    state = childRoute.state;
  }

  return false;
}
