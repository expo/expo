import { createContext } from 'react';

import { LinkingOptions, ParamListBase, createNavigatorFactory } from '@react-navigation/native';
import { RouteNode } from '../Route';
import { sortRoutesWithInitial } from '../sortRoutes';
import {
  createGetIdForRoute,
  getQualifiedRouteComponent,
  screenOptionsFactory,
} from '../useScreens';
import { Href } from '../types';

// `@react-navigation/core` does not expose the Screen or Group components directly, so we have to
// do this hack.
const { Screen } = createNavigatorFactory({} as any)();

export type PolymorphicProps<E extends React.ElementType> = React.PropsWithChildren<
  React.ComponentPropsWithoutRef<E> & {
    as?: E;
  }
>;

export type ScreenTrigger<T extends string | object> = {
  href: Href<T>;
};

export type ScreenConfig = {
  routeNode: RouteNode;
};

export function triggersToScreens<T extends string | object>(
  triggers: ScreenTrigger<T>[],
  layoutRouteNode: RouteNode,
  linking: LinkingOptions<ParamListBase>,
  initialRouteName: undefined | string
) {
  const configs: ScreenConfig[] = [];

  for (const { href } of triggers) {
    let state = linking.getStateFromPath?.(href as any, linking.config)?.routes[0];

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

    let routeNode = layoutRouteNode.children.find((child) => child.route === state?.name);

    if (!routeNode) {
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
  };
}
