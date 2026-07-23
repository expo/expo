import type { UrlObject } from '../LocationProvider';
import type { RouteNode } from '../Route';
import { NOT_FOUND_ROUTE_NAME } from '../constants';
import { resolveHref, resolveHrefStringWithSegments } from '../link/href';
import type {
  LinkingOptions,
  ParamListBase,
  PartialRoute,
  Route,
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
      contextKey: string;
      initialParams?: Record<string, any>;
      action: JumpToNavigationAction;
    }
  | { type: 'external'; name: string; href: string };

export type TriggerMap = Record<string, TriggerConfig>;

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

    const routeNode = layoutRouteNode.children.find((child) => child.route === routeState?.name);

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

    const params = { ...routeState.params };
    let nestedState = routeState.state;
    while (nestedState) {
      const nestedRoute = nestedState.routes[nestedState.index ?? nestedState.routes.length - 1]!;
      Object.assign(params, nestedRoute.params);
      nestedState = nestedRoute.state;
    }

    // TODO(@ubax): Remove nested trigger href support to unify with other tab navigators.
    const action = stateToAction(state, layoutRouteNode.route);
    action.payload.params = { ...params, ...action.payload.params };
    configs.push({
      ...trigger,
      href: resolvedHref,
      routeNode,
      contextKey,
      initialParams: params,
      action,
    });
  }

  const screenProps: ScreenProps[] = [];
  const triggerMap: TriggerMap = { ...parentTriggerMap };

  for (const config of configs) {
    triggerMap[config.name] = config;

    if (config.type === 'internal') {
      screenProps.push({
        name: config.routeNode.route,
        initialParams: config.initialParams,
      });
    }
  }

  const children = useSortedScreens(screenProps);

  return {
    children,
    triggerMap,
  };
}

// TODO(@ubax): Remove stateToAction together with nested trigger href support.
export function stateToAction(
  state: PartialRoute<Route<string, object | undefined>> | undefined,
  startAtRoute?: string
): JumpToNavigationAction {
  const rootPayload: any = {};
  let payload = rootPayload;

  startAtRoute = startAtRoute === '' ? '__root' : startAtRoute;

  let foundStartingPoint = startAtRoute === undefined || !state?.state;

  while (state) {
    if (foundStartingPoint) {
      if (payload === rootPayload) {
        payload.name = state.name;
      } else {
        payload.screen = state.name;
      }
      payload.params = state.params ? { ...state.params } : {};

      state = state.state?.routes[state.state?.routes.length - 1];

      if (state) {
        payload.params ??= {};
        payload = payload.params;
      }
    } else {
      if (state.name === startAtRoute) {
        foundStartingPoint = true;
      }
      const nextState = state.state?.routes[state.state?.routes.length - 1];
      if (nextState) {
        state = nextState;
      }
    }
  }

  return {
    type: 'JUMP_TO',
    payload: rootPayload,
  };
}
