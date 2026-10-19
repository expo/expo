import type { NavigationState } from '../react-navigation/native';
import type { DescribePlaceholderRoute, PlaceholderDescriptorMap } from './types';

export function appendMissingPlaceholderTabDescriptors<
  State extends NavigationState,
  NavigatorOptions extends object,
>(
  descriptors: PlaceholderDescriptorMap<NavigatorOptions>,
  state: State,
  describe: DescribePlaceholderRoute<NavigatorOptions>
): PlaceholderDescriptorMap<NavigatorOptions> {
  const missingRouteNames = state.routeNames.filter(
    (name) => !state.routes.some((route) => route.name === name)
  );
  if (missingRouteNames.length === 0) {
    return descriptors;
  }

  const placeholderDescriptors = missingRouteNames.reduce<
    PlaceholderDescriptorMap<NavigatorOptions>
  >((result, name) => {
    result[name] = describe({ key: undefined, name });
    return result;
  }, {});
  return { ...descriptors, ...placeholderDescriptors };
}

// TODO: Evaluate making this function public.
export function appendMissingPlaceholderTabRoutes<
  State extends NavigationState,
  NavigatorOptions extends object,
>(state: State, descriptors: PlaceholderDescriptorMap<NavigatorOptions>): State {
  const hasMissingRoute = state.routeNames.some(
    (name) => !state.routes.some((route) => route.name === name)
  );
  if (!hasMissingRoute) {
    return state;
  }

  const focusedKey = state.routes[state.index]?.key;
  const routes = state.routeNames.map((name) => {
    const existingRoute = state.routes.find((route) => route.name === name);
    if (existingRoute) {
      return existingRoute;
    }
    return createPlaceholderRoute<State, NavigatorOptions>(name, descriptors);
  });
  const index = Math.max(
    0,
    routes.findIndex((route) => route.key === focusedKey)
  );

  return { ...state, index, routes };
}

function createPlaceholderRoute<State extends NavigationState, NavigatorOptions extends object>(
  name: string,
  descriptors: PlaceholderDescriptorMap<NavigatorOptions>
): State['routes'][number] {
  const descriptor = descriptors[name];
  if (!descriptor) {
    throw new Error(
      `Could not find a descriptor for route "${name}". This is most likely a bug in expo-router. Please report it at https://github.com/expo/expo/issues.`
    );
  }

  return { ...descriptor.route, key: name, name } as State['routes'][number];
}
