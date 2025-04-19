'use client';

import {
  type EventMapBase,
  type NavigationState,
  type ParamListBase,
  type RouteProp,
  type ScreenListeners,
} from '@react-navigation/native';
import React from 'react';

import { RouteNode, sortRoutesWithInitial, useRouteNode } from './Route';
import { Screen } from './primitives';
import { getQualifiedRouteComponent } from './routes/getRouteComponent';
import { UnknownOutputParams } from './types';

export type ScreenProps<
  TOptions extends Record<string, any> = Record<string, any>,
  TState extends NavigationState = NavigationState,
  TEventMap extends EventMapBase = EventMapBase,
> = {
  /** Name is required when used inside a Layout component. */
  name?: string;
  /**
   * Redirect to the nearest sibling route.
   * If all children are `redirect={true}`, the layout will render `null` as there are no children to render.
   */
  redirect?: boolean;
  initialParams?: Record<string, any>;
  options?:
    | TOptions
    | ((prop: { route: RouteProp<ParamListBase, string>; navigation: any }) => TOptions);

  listeners?:
    | ScreenListeners<TState, TEventMap>
    | ((prop: {
        route: RouteProp<ParamListBase, string>;
        navigation: any;
      }) => ScreenListeners<TState, TEventMap>);

  getId?: ({ params }: { params?: Record<string, any> }) => string | undefined;

  dangerouslySingular?: SingularOptions;
};

export type SingularOptions =
  | boolean
  | ((name: string, params: UnknownOutputParams) => string | undefined);

function getSortedChildren(
  children: RouteNode[],
  order?: ScreenProps[],
  initialRouteName?: string
): { route: RouteNode; props: Partial<ScreenProps> }[] {
  if (!order?.length) {
    return children
      .sort(sortRoutesWithInitial(initialRouteName))
      .map((route) => ({ route, props: {} }));
  }
  const entries = [...children];

  const ordered = order
    .map(
      ({
        name,
        redirect,
        initialParams,
        listeners,
        options,
        getId,
        dangerouslySingular: singular,
      }) => {
        if (!entries.length) {
          console.warn(
            `[Layout children]: Too many screens defined. Route "${name}" is extraneous.`
          );
          return null;
        }
        const matchIndex = entries.findIndex((child) => child.route === name);
        if (matchIndex === -1) {
          console.warn(
            `[Layout children]: No route named "${name}" exists in nested children:`,
            children.map(({ route }) => route)
          );
          return null;
        } else {
          // Get match and remove from entries
          const match = entries[matchIndex];
          entries.splice(matchIndex, 1);

          // Ensure to return null after removing from entries.
          if (redirect) {
            if (typeof redirect === 'string') {
              throw new Error(`Redirecting to a specific route is not supported yet.`);
            }
            return null;
          }

          if (getId) {
            console.warn(
              `Deprecated: prop 'getId' on screen ${name} is deprecated. Please rename the prop to 'dangerouslySingular'`
            );
            if (singular) {
              console.warn(
                `Screen ${name} cannot use both getId and dangerouslySingular together.`
              );
            }
          } else if (singular) {
            // If singular is set, use it as the getId function.
            if (typeof singular === 'string') {
              getId = () => singular;
            } else if (typeof singular === 'function' && name) {
              getId = (options) => singular(name, options.params || {});
            } else if (singular === true && name) {
              getId = (options) => getSingularId(name, options);
            }
          }

          return {
            route: match,
            props: { initialParams, listeners, options, getId },
          };
        }
      }
    )
    .filter(Boolean) as {
    route: RouteNode;
    props: Partial<ScreenProps>;
  }[];

  // Add any remaining children
  ordered.push(
    ...entries.sort(sortRoutesWithInitial(initialRouteName)).map((route) => ({ route, props: {} }))
  );

  return ordered;
}

/**
 * @returns React Navigation screens sorted by the `route` property.
 */
export function useSortedScreens(order: ScreenProps[]): React.ReactNode[] {
  const node = useRouteNode();

  const sorted = node?.children?.length
    ? getSortedChildren(node.children, order, node.initialRouteName)
    : [];
  return React.useMemo(
    () => sorted.map((value) => routeToScreen(value.route, value.props)),
    [sorted]
  );
}

export function screenOptionsFactory(
  route: RouteNode,
  options?: ScreenProps['options']
): ScreenProps['options'] {
  return (args) => {
    // Only eager load generated components
    const staticOptions = route.generated ? route.loadRoute()?.getNavOptions : null;
    const staticResult = typeof staticOptions === 'function' ? staticOptions(args) : staticOptions;
    const dynamicResult = typeof options === 'function' ? options?.(args) : options;
    const output = {
      ...staticResult,
      ...dynamicResult,
    };

    // Prevent generated screens from showing up in the tab bar.
    if (route.generated) {
      output.tabBarItemStyle = { display: 'none' };
      output.tabBarButton = () => null;
      // TODO: React Navigation doesn't provide a way to prevent rendering the drawer item.
      output.drawerItemStyle = { height: 0, display: 'none' };
    }

    return output;
  };
}

export function routeToScreen(
  route: RouteNode,
  { options, getId, ...props }: Partial<ScreenProps> = {}
) {
  return (
    <Screen
      {...props}
      name={route.route}
      key={route.route}
      getId={getId}
      options={screenOptionsFactory(route, options)}
      getComponent={() => getQualifiedRouteComponent(route)}
    />
  );
}

export function getSingularId(
  name: string,
  options: { params?: Record<string, any> | undefined } = {}
) {
  return name
    .split('/')
    .map((segment) => {
      if (segment.startsWith('[...')) {
        return options.params?.[segment.slice(4, -1)]?.join('/') || segment;
      } else if (segment.startsWith('[')) {
        return options.params?.[segment.slice(1, -1)] || segment;
      } else {
        return segment;
      }
    })
    .join('/');
}
