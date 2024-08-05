import { LinkingOptions, ParamListBase, createNavigatorFactory } from '@react-navigation/native';
import { RouteNode } from '../Route';
import { sortRoutesWithInitial } from '../sortRoutes';
import { getQualifiedRouteComponent } from '../useScreens';
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
  initialRoute?: boolean | string | string[];
};

export type ScreenConfig = {
  routeNode: RouteNode;
};

export function triggersToScreens<T extends string | object>(
  triggers: ScreenTrigger<T>[],
  layoutRouteNode: RouteNode,
  linking: LinkingOptions<ParamListBase>,
  currentGroups: string[],
  initialRouteName = layoutRouteNode.initialRouteName
) {
  const screenConfig = triggers.reduce((acc, { href, initialRoute }) => {
    debugger;
    let state = linking.getStateFromPath?.(href as any, linking.config)?.routes[0];

    if (!state) {
      return acc;
    }

    let a = linking.getStateFromPath?.(href as any, linking.config);
    debugger;

    if (layoutRouteNode.route) {
      while (state?.state) {
        const previousState = state;
        state = state.state.routes[state.state.index ?? state.state.routes.length - 1];
        if (previousState.name === layoutRouteNode.route) break;
      }
    }

    let routeNode = layoutRouteNode.children.find((child) => child.route === state?.name);

    if (routeNode) {
      if (isInitialRoute(initialRoute, currentGroups)) {
        if (process.env.NODE_ENV === 'development') {
          if (initialRouteName) {
            console.warn(`Initial route name has been set multiple times`);
          }
        }
        initialRouteName = routeNode.route;
      }

      acc.push({ routeNode });
    }

    return acc;
  }, [] as ScreenConfig[]);

  const sortFn = sortRoutesWithInitial(initialRouteName);

  const children = screenConfig
    .sort((a, b) => sortFn(a.routeNode, b.routeNode))
    .map(({ routeNode }) => (
      <Screen name={routeNode.route} getComponent={() => getQualifiedRouteComponent(routeNode)} />
    ));

  return {
    children,
    initialRouteName,
  };
}

function isInitialRoute(initialRoute: ScreenTrigger<any>['initialRoute'], groups: string[]) {
  let match = false;

  if (initialRoute === true) {
    match = true;
  } else if (Array.isArray(initialRoute)) {
    match = initialRoute.some((route) => groups.includes(route));
  } else if (typeof initialRoute === 'string') {
    match = groups.includes(initialRoute);
  }

  return match;
}
