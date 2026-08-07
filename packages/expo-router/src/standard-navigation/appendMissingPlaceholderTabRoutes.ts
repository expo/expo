import type { NavigationState, RenderState } from '../react-navigation/native';
import type { DescribePlaceholderRoute, PlaceholderDescriptorMap } from './types';

export function appendMissingPlaceholderTabDescriptors<State extends NavigationState>(
  descriptors: PlaceholderDescriptorMap,
  state: RenderState<State>,
  describe: DescribePlaceholderRoute
): PlaceholderDescriptorMap {
  const missingRouteNames = state.routeNames.filter(
    (name) => !state.routes.some((route) => route.name === name)
  );
  if (missingRouteNames.length === 0) {
    return descriptors;
  }

  const placeholderDescriptors = missingRouteNames.reduce<PlaceholderDescriptorMap>(
    (result, name) => {
      result[name] = describe({ key: undefined, name });
      return result;
    },
    {}
  );
  return { ...descriptors, ...placeholderDescriptors };
}

// TODO: Evaluate making this function public.
export function appendMissingPlaceholderTabRoutes<State extends NavigationState>(
  state: RenderState<State>,
  descriptors: PlaceholderDescriptorMap
): RenderState<State> {
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
    return createPlaceholderRoute<State>(name, descriptors);
  });
  const index = Math.max(
    0,
    routes.findIndex((route) => route.key === focusedKey)
  );

  // Existing render routes and placeholders are all keyed.
  return { ...state, index, routes } as RenderState<State>;
}

function createPlaceholderRoute<State extends NavigationState>(
  name: string,
  descriptors: PlaceholderDescriptorMap
): State['routes'][number] {
  const descriptor = descriptors[name];
  if (!descriptor) {
    throw new Error(
      `Could not find a descriptor for route "${name}". This is most likely a bug in expo-router. Please report it at https://github.com/expo/expo/issues.`
    );
  }

  return { ...descriptor.route, key: name, name } as State['routes'][number];
}
