import { Slot } from '@radix-ui/react-slot';
import {
  LinkingOptions,
  NavigationAction,
  ParamListBase,
  PartialRoute,
  Route,
  createNavigatorFactory,
} from '@react-navigation/native';
import { Pressable, PressableProps, ViewProps, View } from 'react-native';

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
export const PressableSlot = Slot as React.ForwardRefExoticComponent<
  PressableProps & React.RefAttributes<typeof Pressable>
>;

export type ScreenTrigger<T extends string | object> = {
  href: Href<T>;
  name: string;
};

export type ResolvedScreenTrigger = {
  href: string;
  name: string;
};

export type TriggerMap = Map<
  string,
  {
    navigate: any;
    switch: any;
  }
>;

export function triggersToScreens(
  triggers: ScreenTrigger<any>[] | ResolvedScreenTrigger[],
  layoutRouteNode: RouteNode,
  linking: LinkingOptions<ParamListBase>,
  initialRouteName: undefined | string
) {
  const configs: { routeNode: RouteNode }[] = [];

  const triggerMap: TriggerMap = new Map();

  for (const trigger of triggers) {
    let state = linking.getStateFromPath?.(resolveHref(trigger.href), linking.config)?.routes[0];

    if (!state) {
      continue;
    }

    triggerMap.set(trigger.name, {
      navigate: stateToActionPayload(state, layoutRouteNode.route),
      switch: stateToActionPayload(state, layoutRouteNode.route, { depth: 1 }),
    });

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

    configs.push({ routeNode });
  }

  const sortFn = sortRoutesWithInitial(initialRouteName);

  const children = configs
    .sort((a, b) => sortFn(a.routeNode, b.routeNode))
    .map(({ routeNode }) => (
      <Screen
        key={routeNode.route}
        name={routeNode.route}
        getId={createGetIdForRoute(routeNode)}
        getComponent={() => getQualifiedRouteComponent(routeNode)}
        options={screenOptionsFactory(routeNode)}
      />
    ));

  return {
    children,
    triggerMap,
  };
}

function stateToActionPayload(
  state: PartialRoute<Route<string, object | undefined>> | undefined,
  startAtRoute: string,
  { depth = Infinity } = {}
): NavigationAction['payload'] {
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
      }

      const nextState = state.state?.routes[state.state?.routes.length - 1];
      if (nextState) {
        state = nextState;
      }
    }
  }

  return {
    payload: rootPayload,
  };
}
