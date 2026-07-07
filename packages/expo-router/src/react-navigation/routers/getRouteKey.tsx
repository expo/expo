// Single authority for deterministic, globally-unique navigation keys.
//
// Keys are structural paths: every key embeds the chain of parents above it, so two mounted
// instances of the same route never collide. A route key is derived from the navigator's own
// `state.key`, the screen `name`, and a per-name `index`; a navigator's state key is simply the key
// of the route it renders under (the root has no parent route, so it gets the `@` seed). Because
// keys are pure functions of position, any layer can recompute the key the router will assign
// without waiting for the route to exist, and the compiler produces the same keys as the live
// reducers. No implementation should depend on the key structure — only on its uniqueness and
// determinism.

const SEP = ':';
const ESCAPE = '%';

// Escape a route name so it can't be confused with the structural encoding. The escape char is
// escaped first, then the separator, so `:` in a name becomes `%:` (never a bare separator) and the
// whole scheme stays injective. Only route NAMES need escaping — the parent state key is already an
// escaped composition, and the index is a plain integer.
function escapeRouteName(name: string): string {
  return name.split(ESCAPE).join(`${ESCAPE}${ESCAPE}`).split(SEP).join(`${ESCAPE}${SEP}`);
}

/**
 * Derive a route key from the navigator's `stateKey`, the screen `name`, and a per-name `index`
 * (default 0). The index is ALWAYS emitted so the encoding is injective (a name ending in a number
 * can't collide with a higher-index sibling). Only `name` is escaped; `stateKey` is passed through
 * verbatim.
 */
export function getRouteKey({
  stateKey,
  name,
  index,
}: {
  stateKey: string;
  name: string;
  index?: number;
}): string {
  return `${stateKey}${SEP}${escapeRouteName(name)}${SEP}${index ?? 0}`;
}

/**
 * Derive a navigator's state key: the key of the route it renders under, verbatim. The root
 * container has no parent route, so it gets the `@` seed. `@` contains no separator and no route key
 * equals it (every route key contains a `:`), so the seed is unique.
 */
export function getStateKey(parentRouteKey: string | undefined): string {
  return parentRouteKey === undefined ? '@' : parentRouteKey;
}

/**
 * Pick a key for a new `name` route under `stateKey`. The base index is how many routes already use
 * `name` (so repeated routes get sequential keys without rescanning); the loop only bumps the index
 * further on the off chance that base key is already taken.
 */
export function getNextRouteKeyFromState({
  stateKey,
  name,
  state,
}: {
  stateKey: string;
  name: string;
  state: { routes: readonly { key: string; name: string }[] };
}): string {
  let index = state.routes.filter((route) => route.name === name).length;
  let key = getRouteKey({ stateKey, name, index });
  while (state.routes.some((route) => route.key === key)) {
    index += 1;
    key = getRouteKey({ stateKey, name, index });
  }
  return key;
}

/**
 * Dev tripwire for the Step-4 `payload.state` attach: a route's nested state key must equal the
 * route key (see `getStateKey`). Routers attach `payload.state` verbatim, but the key a router mints
 * (via `getNextRouteKeyFromState`) depends on the live state, so an emitter (Step 5+) that computes
 * keys in isolation can disagree — e.g. a duplicate-name push mints `…:1` while an isolated build
 * yields `…:0`. A mismatch silently breaks action targeting, so fail loudly in dev instead.
 */
export function assertSubtreeKeyMatchesRoute(
  routeKey: string,
  subtree: { key?: string } | undefined
): void {
  if (
    process.env.NODE_ENV === 'development' &&
    subtree?.key !== undefined &&
    subtree.key !== routeKey
  ) {
    throw new Error(
      `Navigation subtree key "${subtree.key}" does not match its route key "${routeKey}". ` +
        `A route's nested state key must equal the route key. This usually means the action's ` +
        `payload.state was built with keys computed in isolation from the live navigation state — ` +
        `mint the subtree's keys against the live state (see getNextRouteKeyFromState).`
    );
  }
}
