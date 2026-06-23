// Single authority for deterministic route-key generation.
//
// A route's key is derived from the navigator's `pathname` (its location in the route tree, i.e.
// its contextKey), the screen `name`, and a per-name `index`. The pathname keeps keys unique across
// navigators; the index disambiguates same-name routes within one navigator (e.g. a stack that
// pushes the same screen twice). Because the key is a pure function of these inputs, any layer can
// recompute the key the router will assign without waiting for the route to exist.

/**
 * Derive a route key from `pathname`, `name`, and a per-name `index`. The index is appended only
 * when greater than 0; the pathname is omitted when absent (we never emit the literal "undefined"),
 * keeping the common tab key clean (e.g. `/(tabs)-home`).
 */
export function getRouteKey(pathname: string | undefined, name: string, index: number = 0): string {
  const base = pathname ? `${pathname}-${name}` : name;
  return index > 0 ? `${base}-${index}` : base;
}

/**
 * Pick a key for a new `name` route under `pathname`. The base index is how many routes already use
 * `name` (so repeated routes get sequential keys without rescanning); the loop only bumps the index
 * further on the off chance that base key is already taken.
 */
export function getNextRouteKeyFromState(
  pathname: string | undefined,
  name: string,
  state: { routes: readonly { key: string; name: string }[] }
): string {
  let index = state.routes.filter((route) => route.name === name).length;
  let key = getRouteKey(pathname, name, index);
  while (state.routes.some((route) => route.key === key)) {
    index += 1;
    key = getRouteKey(pathname, name, index);
  }
  return key;
}
