// Test helpers for the "complete, keyed state" contract that `getStateFromPath` now emits.
//
// `expectComplete` asserts the invariant recursively (stale/key/index/routeNames/nested state).
// `stripCompleteness` removes the completeness additions so the existing upstream/fork literals
// (which predate keys and stale) still match via `toEqual`. Keeping the literals untouched is why
// the suites wrap `getStateFromPath` in a normalizer instead of rewriting 100+ nested objects.

type AnyState = {
  stale?: unknown;
  key?: unknown;
  index?: unknown;
  routeNames?: unknown;
  routes: AnyRoute[];
};

type AnyRoute = {
  key?: unknown;
  name: string;
  path?: string;
  params?: Record<string, unknown>;
  state?: AnyState;
};

// A level's screens config: the same `options.screens` shape passed to `getStateFromPath` — each
// value is a string pattern or an object that may carry its own nested `screens`. Accepted as a
// plain `object` so the strongly-typed `PathConfigMap` passes without casts; narrowed at runtime.
type ScreensConfig = Record<string, unknown>;

export function expectComplete(state: AnyState | undefined, screens?: object): void {
  if (state === undefined) {
    throw new Error('expectComplete received undefined state');
  }
  expectCompleteLevel(state, [], screens as ScreensConfig | undefined);
}

// The nested screens config for route `name`, if that route is itself a navigator (non-empty
// `screens`). Returns undefined for leaf routes so the config-aware check only fires on navigators.
function childScreens(
  screens: ScreensConfig | undefined,
  name: string
): ScreensConfig | undefined {
  const entry = screens?.[name];
  if (entry && typeof entry === 'object' && 'screens' in entry) {
    const nested = (entry as { screens?: unknown }).screens;
    if (nested && typeof nested === 'object' && Object.keys(nested).length) {
      return nested as ScreensConfig;
    }
  }
  return undefined;
}

function expectCompleteLevel(state: AnyState, path: string[], screens?: ScreensConfig): void {
  const at = path.length ? ` at ${path.join(' > ')}` : ' at root';

  if (state.stale !== false) {
    throw new Error(`Expected stale === false${at}, got ${String(state.stale)}`);
  }
  if (typeof state.key !== 'string' || state.key.length === 0) {
    throw new Error(`Expected a non-empty state key${at}, got ${String(state.key)}`);
  }
  if (!Array.isArray(state.routeNames) || state.routeNames.length === 0) {
    throw new Error(`Expected non-empty routeNames${at}`);
  }
  if (
    typeof state.index !== 'number' ||
    state.index < 0 ||
    state.index >= state.routes.length ||
    !state.routes[state.index]
  ) {
    throw new Error(
      `Expected index in range${at}, got ${String(state.index)} for ${state.routes.length} routes`
    );
  }

  for (const route of state.routes) {
    if (typeof route.key !== 'string' || route.key.length === 0) {
      throw new Error(`Expected a route key${at} for route '${route.name}'`);
    }
    if (!(state.routeNames as string[]).includes(route.name)) {
      throw new Error(`Route '${route.name}'${at} is not in routeNames [${state.routeNames}]`);
    }
    // When a config is supplied, a route that is itself a navigator must carry its nested state —
    // a hollow navigator route (no `state`) is otherwise invisible to the recursion below.
    const nested = childScreens(screens, route.name);
    if (nested && route.state === undefined) {
      throw new Error(
        `Route '${route.name}'${at} is a navigator (config declares screens) but has no nested state`
      );
    }
    if (route.state !== undefined) {
      expectCompleteLevel(route.state, [...path, route.name], nested);
    }
  }
}

// Deep copy with the completeness additions removed. `index` is dropped only when it is 0, because
// the upstream literals omit index (implicit 0) but explicitly assert `index: 1` for inserted
// initial routes — those must survive the strip.
export function stripCompleteness<T>(state: T): T {
  if (state === undefined || state === null || typeof state !== 'object') {
    return state;
  }
  const input = state as unknown as AnyState;
  const output: Record<string, unknown> = {};

  if ('index' in input && input.index !== 0) {
    output.index = input.index;
  }

  output.routes = input.routes.map((route) => {
    const nextRoute: Record<string, unknown> = { name: route.name };
    if ('path' in route) nextRoute.path = route.path;
    if ('params' in route) nextRoute.params = route.params;
    if (route.state !== undefined) nextRoute.state = stripCompleteness(route.state);
    return nextRoute;
  });

  return output as unknown as T;
}
