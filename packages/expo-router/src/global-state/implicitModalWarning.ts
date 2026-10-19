import isEqual from 'react-fast-compare';

import type { DescriptorRouteProp, ParamListBase } from '../react-navigation/core';
import type { NativeStackNavigationOptions } from '../react-navigation/native-stack';
import type { NavigationAction, NavigationState } from '../react-navigation/routers';
import { isModalPresentation } from '../utils/stackPresentation';
import { shouldLinkExternally } from '../utils/url';
import { getNavigateAction, type NavigateActionConfig } from './getNavigationAction';
import { indexNavigationTree, reduceNavigationTree, resolveOrigin } from './reduceNavigationTree';
import type { LinkToOptions } from './types';

type NativeStackDescriptor = {
  options: NativeStackNavigationOptions;
  route: DescriptorRouteProp<ParamListBase, string>;
};
type DescribeNativeStackRoute = (
  route: DescriptorRouteProp<ParamListBase, string>
) => NativeStackDescriptor;

export type NativeStackRegistration = {
  stateKey: string;
  contextKey?: string;
  routeKeys: readonly string[];
  descriptors: Readonly<Record<string, NativeStackDescriptor | undefined>>;
  describe: DescribeNativeStackRoute;
  getOptionsOverrides: (routeKey: string) => NativeStackNavigationOptions | undefined;
  getRouteContextKey?: (routeName: string) => string | undefined;
};

const describeByDescriptors = new WeakMap<object, DescribeNativeStackRoute>();
const nativeStacks = new Map<string, { registration: NativeStackRegistration }[]>();
const warnedRoutes = new Set<string>();
let warningEnabled = true;

/** Disables the development warning for card routes that are implicitly presented as modals. */
export function disableImplicitModalWarning() {
  warningEnabled = false;
}

export function resetImplicitModalWarningForTests() {
  warningEnabled = true;
  warnedRoutes.clear();
}

export function captureNativeStackDescribe<T extends object>(
  descriptors: T,
  _state: unknown,
  describe: DescribeNativeStackRoute
): T {
  describeByDescriptors.set(descriptors, describe);
  return descriptors;
}

export function getNativeStackDescribe(descriptors: object) {
  return describeByDescriptors.get(descriptors);
}

export function registerNativeStack(registration: NativeStackRegistration) {
  const entry = { registration };
  nativeStacks.set(registration.stateKey, [
    ...(nativeStacks.get(registration.stateKey) ?? []),
    entry,
  ]);
  return () => {
    // Navigation reports from this commit consume the registration before the microtask runs.
    queueMicrotask(() => {
      const remaining = nativeStacks
        .get(registration.stateKey)
        ?.filter((candidate) => candidate !== entry);
      if (!remaining?.length) {
        nativeStacks.delete(registration.stateKey);
      } else {
        nativeStacks.set(registration.stateKey, remaining);
      }
    });
  };
}

export function warnIfCardRouteShowsAsModal(
  href: string,
  options: LinkToOptions,
  navigationState: NavigationState,
  config: NavigateActionConfig,
  localStacks: readonly NativeStackRegistration[] = []
) {
  if (
    !__DEV__ ||
    !warningEnabled ||
    process.env.EXPO_OS === 'web' ||
    href === '..' ||
    href === '../' ||
    shouldLinkExternally(href)
  ) {
    return;
  }

  const action = getActionForHref(href, options, navigationState, config);
  return action
    ? projectAction(navigationState, action, config, undefined, true, localStacks)
    : navigationState;
}

export function warnIfAffectedCardRouteShowsAsModal(
  navigationState: NavigationState,
  affectedRouteKey: string,
  config: NavigateActionConfig
) {
  if (!__DEV__ || !warningEnabled || process.env.EXPO_OS === 'web') {
    return;
  }
  warnForAffectedRoute(navigationState, affectedRouteKey, [], config);
}

function getActionForHref(
  href: string,
  options: LinkToOptions,
  navigationState: NavigationState,
  config: NavigateActionConfig
): NavigationAction | undefined {
  let resolution: ReturnType<typeof getNavigateAction>;
  try {
    resolution = getNavigateAction(
      href,
      options,
      config,
      options.event,
      options.withAnchor,
      options.dangerouslySingular,
      options.__internal__PreviewKey,
      navigationState,
      false
    );
  } catch {
    return;
  }

  return resolution.status === 'action' ? resolution.action : undefined;
}

function projectAction(
  navigationState: NavigationState,
  action: NavigationAction,
  config: NavigateActionConfig,
  originKey: string | undefined,
  shouldWarn: boolean,
  localStacks: readonly NativeStackRegistration[] = []
): NavigationState {
  const tree = indexNavigationTree(navigationState);
  const origin = resolveOrigin(tree.rootNode, tree.nodes, config.registry, originKey);
  if (!origin) {
    return navigationState;
  }
  const result = reduceNavigationTree(action, config.registry, { origin, tree });
  if (!result.handled) {
    return navigationState;
  }
  if (shouldWarn && result.affectedRouteKey !== undefined) {
    warnForAffectedRoute(result.nextState, result.affectedRouteKey, localStacks, config);
  }
  return result.nextState;
}

function warnForAffectedRoute(
  navigationState: NavigationState,
  affectedRouteKey: string,
  localStacks: readonly NativeStackRegistration[],
  config: NavigateActionConfig
) {
  let destination = findRoute(navigationState, affectedRouteKey);
  while (destination) {
    const { state: destinationState, route: targetRoute } = destination;

    const localStack = localStacks.find(({ stateKey }) => stateKey === destinationState.key);
    const stacks = localStack ? [localStack] : getNativeStackRegistrations(destinationState);
    if (stacks.length > 0) {
      warnForStackRoute(destinationState, targetRoute, stacks, config);
    }

    if (targetRoute.state?.stale !== false) {
      return;
    }
    const nestedState = targetRoute.state;
    const nestedRoute = nestedState.routes[nestedState.index];
    destination = nestedRoute ? { state: nestedState, route: nestedRoute } : undefined;
  }
}

function getNativeStackRegistrations(state: NavigationState) {
  return nativeStacks.get(state.key)?.map(({ registration }) => registration) ?? [];
}

function findRoute(
  state: NavigationState,
  routeKey: string
): { state: NavigationState; route: NavigationState['routes'][number] } | undefined {
  for (const route of state.routes) {
    if (route.key === routeKey) {
      return { state, route };
    }
    if (route.state?.stale === false) {
      const result = findRoute(route.state, routeKey);
      if (result) {
        return result;
      }
    }
  }
  return undefined;
}

function warnForStackRoute(
  state: NavigationState,
  targetRoute: NavigationState['routes'][number],
  stacks: readonly NativeStackRegistration[],
  config: NavigateActionConfig
) {
  if (getRoutePresentation(targetRoute, stacks) !== undefined) {
    return;
  }

  let hasModalRoute = false;
  for (const route of state.routes) {
    if (route.isPreloaded) {
      continue;
    }
    if (route.key === targetRoute.key) {
      if (hasModalRoute) {
        const stack = getRegistrationForRoute(targetRoute, stacks);
        const routeId =
          stack?.getRouteContextKey?.(targetRoute.name) ??
          `${stack?.contextKey ?? config.registry.get(state.key)?.routeNode?.contextKey ?? state.key}:${targetRoute.name}`;
        if (!warnedRoutes.has(routeId)) {
          warnedRoutes.add(routeId);
          console.warn(
            `The route "${targetRoute.name}" has no presentation set, but it will be presented as a modal because a modal route precedes it in the stack. This behavior may change in a future version of Expo Router. Set presentation dynamically from route params with \`options={({ route }) => ...}\`, or create separate card and sheet routes that share one content component.`
          );
        }
      }
      return;
    }
    if (isModalPresentation({ presentation: getRoutePresentation(route, stacks) })) {
      hasModalRoute = true;
    }
  }
}

function getRoutePresentation(
  route: NavigationState['routes'][number],
  stacks: readonly NativeStackRegistration[]
) {
  const stack = getRegistrationForRoute(route, stacks);
  if (!stack) {
    return;
  }
  const overrides = stack.getOptionsOverrides(route.key);
  if (overrides && Object.hasOwn(overrides, 'presentation')) {
    return overrides.presentation;
  }

  const descriptor = stack.descriptors[route.key];
  if (descriptor && isEqual(descriptor.route.params, route.params)) {
    return descriptor.options.presentation;
  }
  return stack.describe({ ...route, key: undefined }).options.presentation;
}

function getRegistrationForRoute(
  route: NavigationState['routes'][number],
  stacks: readonly NativeStackRegistration[]
) {
  for (let index = stacks.length - 1; index >= 0; index--) {
    const stack = stacks[index]!;
    if (stack.routeKeys.includes(route.key)) {
      return stack;
    }
  }
  return stacks[stacks.length - 1];
}
