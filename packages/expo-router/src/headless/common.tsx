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
  initialRoute?: boolean;
};

export type ScreenConfig = {
  routeNode: RouteNode;
};

export function triggersToScreens<T extends ScreenTrigger<any>>(
  triggers: T[],
  layoutRouteNode: RouteNode,
  linking: LinkingOptions<ParamListBase>
) {
  let initialRouteName: string | undefined;

  const screenConfig = triggers.reduce((acc, { href, initialRoute }) => {
    let state = linking.getStateFromPath?.(href as any, linking.config)?.routes[0];

    if (!state) {
      return acc;
    }

    if (layoutRouteNode.route) {
      while (state?.state) {
        const previousState = state;
        state = state.state.routes[0];
        if (previousState.name === layoutRouteNode.route) break;
      }
    }

    let routeNode = layoutRouteNode.children.find((child) => child.route === state?.name);

    if (routeNode) {
      // const key = `${routeNode.route}#${index}`;
      if (initialRoute) {
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
