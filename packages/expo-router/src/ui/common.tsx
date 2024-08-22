import { Slot } from '@radix-ui/react-slot';
import {
  LinkingOptions,
  ParamListBase,
  PartialRoute,
  Route,
  createNavigatorFactory,
} from '@react-navigation/native';
import { ViewProps, View } from 'react-native';

import type { ExpoTabActionType } from './TabRouter';
import { RouteNode } from '../Route';
import { resolveHref } from '../link/href';
import { sortRoutesWithInitial } from '../sortRoutes';
import { Href } from '../types';
import {
  createGetIdForRoute,
  getQualifiedRouteComponent,
  screenOptionsFactory,
} from '../useScreens';

// `@react-navigation/core` does not expose the Screen or Group components directly, so we have to
// do this hack.
const { Screen } = createNavigatorFactory({} as any)();

// Fix the TypeScript types for <Slot />. It complains about the ViewProps["style"]
export const ViewSlot = Slot as React.ForwardRefExoticComponent<
  ViewProps & React.RefAttributes<View>
>;

export type ScreenTrigger<T extends string | object> =
  | {
      type: 'internal';
      href: Href<T>;
      name: string;
    }
  | {
      type: 'external';
      name: string;
      href: string;
    };

type JumpToNavigationAction = Extract<ExpoTabActionType, { type: 'JUMP_TO' }>;
type TriggerConfig =
  | { type: 'internal'; name: string; routeNode: RouteNode; action: JumpToNavigationAction }
  | { type: 'external'; name: string; href: string };
export type TriggerMap = Record<string, TriggerConfig & { index: number }>;

export function triggersToScreens(
  triggers: ScreenTrigger<any>[],
  layoutRouteNode: RouteNode,
  linking: LinkingOptions<ParamListBase>,
  initialRouteName: undefined | string
) {
  const configs: TriggerConfig[] = [];

  for (const trigger of triggers) {
    if (trigger.type === 'external') {
      configs.push(trigger);
      continue;
    }

    let state = linking.getStateFromPath?.(resolveHref(trigger.href), linking.config)?.routes[0];

    if (!state) {
      continue;
    }

    if (layoutRouteNode.route) {
      while (state?.state) {
        const previousState = state;
        state = state.state.routes[state.state.index ?? state.state.routes.length - 1];
        if (previousState.name === layoutRouteNode.route) break;
      }
    }

    const routeNode = layoutRouteNode.children.find((child) => child.route === state?.name);

    if (!routeNode) {
      continue;
    }

    if (routeNode.generated && routeNode.internal && routeNode.route.includes('+not-found')) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `Tab trigger '${trigger.name}' has the href '${trigger.href}' which points to a +not-found route.`
        );
      }
      continue;
    }

    configs.push({
      ...trigger,
      routeNode,
      action: stateToAction(state, layoutRouteNode.route),
    });
  }

  const sortFn = sortRoutesWithInitial(initialRouteName);

  const sortedConfigs = configs.sort((a, b) => {
    // External routes should be last. They will eventually be dropped
    if (a.type === 'external' && b.type === 'external') {
      return 0;
    } else if (a.type === 'external') {
      return 1;
    } else if (b.type === 'external') {
      return -1;
    }

    return sortFn(a.routeNode, b.routeNode);
  });

  const children: React.JSX.Element[] = [];
  const triggerMap: TriggerMap = {};

  for (const [index, config] of sortedConfigs.entries()) {
    triggerMap[config.name] = { ...config, index };

    if (config.type === 'internal') {
      children.push(
        <Screen
          key={config.routeNode.route}
          name={config.routeNode.route}
          getId={createGetIdForRoute(config.routeNode)}
          getComponent={() => getQualifiedRouteComponent(config.routeNode)}
          options={screenOptionsFactory(config.routeNode)}
        />
      );
    }
  }

  return {
    children,
    triggerMap,
  };
}

function stateToAction(
  state: PartialRoute<Route<string, object | undefined>> | undefined,
  startAtRoute: string,
  { depth = Infinity } = {}
): JumpToNavigationAction {
  const rootPayload: any = {};
  let payload = rootPayload;

  let foundStartingPoint = false;

  while (state) {
    if (foundStartingPoint) {
      if (depth === 0) break;
      depth--;

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
      if (state.name === startAtRoute || !startAtRoute) {
        foundStartingPoint = true;
      } else {
        const nextState = state.state?.routes[state.state?.routes.length - 1];
        if (nextState) {
          state = nextState;
        }
      }
    }
  }

  return {
    type: 'JUMP_TO',
    payload: rootPayload,
  };
}
