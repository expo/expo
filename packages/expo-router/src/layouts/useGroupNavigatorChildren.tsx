import { ReactElement, Children, ReactNode, isValidElement, useMemo } from 'react';

import { RouteNode, useRouteNode } from '../Route';
import { sortRoutes, sortRoutesWithAnchor } from '../sortRoutes';
import { ScreenProps, routeToScreen } from '../useScreens';
import { Screen } from '../views/Screen';
import { ScreenRedirect } from '../views/ScreenRedirect';

export type ScreenPropsWithName = ScreenProps & { name: string };

/**
 * Groups a navigator's children into screens and custom children.
 */
export function useGroupNavigatorChildren(
  children: ReactNode,
  {
    isCustomNavigator,
    contextKey,
    processor,
  }: {
    /** Allow non-<Screen /> children */
    isCustomNavigator?: boolean;
    /** Used for sending developer hints */
    contextKey?: string;
    /** Manually process screen children */
    processor?: (options: ScreenPropsWithName[]) => ScreenPropsWithName[];
  } = {}
) {
  const node = useRouteNode();

  return useMemo(() => {
    const nonScreens: ReactNode[] = [];
    const redirects: Map<string, ScreenPropsWithName> = new Map();

    let userScreenOrder = Children.map(children, (child): ScreenPropsWithName | null => {
      // Only custom navigators can have non-element children
      if (!isValidElement(child) || !child) {
        if (isCustomNavigator) {
          nonScreens.push(child);
          return null;
        } else {
          warnLayoutChildren(contextKey);
          return null;
        }
      }

      if (child.type === Screen) {
        if (!assertNameInProps(child)) {
          return errorMissingName('Screen', contextKey);
        }

        if (process.env.NODE_ENV !== 'production') {
          if (
            ['children', 'component', 'getComponent'].some(
              (key) => child.props && typeof child.props === 'object' && key in child.props
            )
          ) {
            throw new Error(
              `<Screen /> component in \`default export\` at \`app${contextKey}/_layout\` must not have a \`children\`, \`component\`, or \`getComponent\` prop when used as a child of a Layout Route`
            );
          }

          return child.props as ScreenPropsWithName;
        }
      }

      if (child.type === ScreenRedirect) {
        if (!assertNameInProps(child)) {
          return errorMissingName('Screen', contextKey);
        }

        redirects.set(child.props.name, child.props as ScreenPropsWithName);
      }

      // Custom Navigators can have any type of child
      if (isCustomNavigator) {
        nonScreens.push(child);
        return null;
      }

      warnLayoutChildren(contextKey);
      return null;
    });

    // Add an assertion for development
    if (userScreenOrder) {
      if (process.env.NODE_ENV !== 'production') {
        // Assert if names are not unique
        const seen = new Set<string>();

        for (const screen of userScreenOrder) {
          if (seen.has(screen.name)) {
            throw new Error(`Screen names must be unique: ${screen.name}`);
          }
          seen.add(screen.name);
        }
      }
    }

    userScreenOrder ||= [];

    if (processor) {
      userScreenOrder = processor(userScreenOrder);
    }

    const screens = getScreens(node, userScreenOrder, redirects);

    return {
      screens,
      nonScreens,
    };
  }, [children, processor, node]);
}

function getScreens(
  node: RouteNode,
  order: ScreenPropsWithName[],
  redirects: Map<string, ScreenPropsWithName>
): ReactNode[] {
  const children = node.children;
  const anchor = node.initialRouteName;

  // If there is no specific order, return the children in the order they were defined
  if (!order.length && !redirects.size) {
    return children.sort(sortRoutesWithAnchor(anchor)).map((route) => routeToScreen(route));
  }

  const childrenNodeMap = new Map(children.map((child) => [child.route, child]));

  const screens: ReactNode[] = [];

  for (const { name, redirect, ...props } of order) {
    const route = childrenNodeMap.get(name);

    if (!route) {
      console.warn(
        `[Layout children]: No route named "${name}" exists in nested children:`,
        ...childrenNodeMap.keys()
      );
      continue;
    }

    // Ensure to return null after removing from entries.
    if (redirect) {
      throw new Error(`Please use <Screen.Redirect /> to declare a redirect.`);
    }

    // Remove from the children so it doesn't get added again
    childrenNodeMap.delete(name);

    // Ensure the anchor is at the start
    if (name === anchor) {
      screens.unshift(routeToScreen(route, props));
    } else {
      screens.push(routeToScreen(route, props));
    }
  }

  // If there is an anchor, add it to the start
  if (anchor) {
    const anchorRoute = childrenNodeMap.get(anchor);

    if (anchorRoute) {
      screens.unshift(routeToScreen(anchorRoute));
      childrenNodeMap.delete(anchor);
    }
  }

  // The remaining nodes where not in the order, so sort them and add them to the end
  const sortedScreens = Array.from(childrenNodeMap.values())
    .sort(sortRoutes)
    .map((route) => routeToScreen(route));

  // Add the remaining screens
  screens.push(...sortedScreens);

  return screens;
}

const warnLayoutChildren = (contextKey?: string) => {
  console.warn(
    `Layout children must be of type Screen, ScreenRedirect or ScreenRewrite. All other children are ignored. To use custom children, create a custom <Layout />. Update Layout Route at: "app${contextKey}/_layout"`
  );
};

const assertNameInProps = (child: ReactNode): child is ReactElement<ScreenPropsWithName> => {
  return Boolean(
    child &&
      typeof child === 'object' &&
      'props' in child &&
      typeof child.props === 'object' &&
      child.props &&
      'name' in child.props &&
      typeof child.props.name === 'string' &&
      child.props.name
  );
};

const errorMissingName = (type: string, contextKey?: string) => {
  throw new Error(
    `<${type} /> component in \`default export\` at \`app${contextKey}/_layout\` must have a \`name\` prop when used as a child of a Layout Route.`
  );
};
