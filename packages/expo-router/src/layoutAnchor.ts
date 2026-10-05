import type { LoadedRoute, RouteNode } from './Route';

// Both caches are keyed by `RouteNode`, so they reset when Fast Refresh builds a new route tree.
// Only read anchors are cached, so a layout that is still loading can be read again later.
const anchors = new WeakMap<RouteNode, string | undefined>();
// On native, `loadRoute` returns a promise on every call, so keep the module once it loads.
const loadedLayouts = new WeakMap<RouteNode, LoadedRoute | undefined>();
// The layouts that `getLayoutAnchor` could not read during the current `collectMissingLayouts` call.
// `getLayoutAnchor` is called from deep inside seeding and the reducer, so this is a module variable
// instead of a parameter passed through every function.
let missingLayouts: Set<RouteNode> | undefined;
let skippedLayouts: ReadonlySet<RouteNode> = new Set();

/**
 * Returns the route name of the layout's anchor. In async import mode, a layout that is not
 * loaded yet has no known anchor; the read starts its download and records it as missing.
 */
export function getLayoutAnchor(node: RouteNode): string | undefined {
  if (node.type !== 'layout') {
    return undefined;
  }
  if (anchors.has(node)) {
    return anchors.get(node);
  }
  // A layout that failed to load keeps the anchor known without loading it.
  if (skippedLayouts.has(node)) {
    return getRouteNamedLikeGroup(node);
  }
  const loaded = loadedLayouts.has(node) ? loadedLayouts.get(node) : node.loadRoute();
  if (isThenable(loaded)) {
    // Keep the module once it loads, so later reads find it even without `loadLayouts`.
    loaded.then(
      // In async import mode, `loadRoute` returns a thenable that resolves to the route module.
      (module) => loadedLayouts.set(node, module as LoadedRoute | undefined),
      () => {}
    );
    missingLayouts?.add(node);
    return undefined;
  }
  const anchor = readAnchor(node, loaded?.unstable_settings);
  anchors.set(node, anchor);
  return anchor;
}

/** Returns the child named like the layout's group, which is the anchor unless settings override it. */
export function getRouteNamedLikeGroup(node: RouteNode): string | undefined {
  return node.children.find((child) => child.route.replace(/\/index$/, '') === node.groupName)
    ?.route;
}

/**
 * Runs `fn` and returns the layouts whose anchors it needed but could not read.
 * Layouts in `skipped` failed to load, so their anchors are skipped without recording them.
 */
export function collectMissingLayouts<T>(
  fn: () => T,
  skipped: ReadonlySet<RouteNode> = new Set()
): { value: T; missing: RouteNode[] } {
  const previous = [missingLayouts, skippedLayouts] as const;
  const current = new Set<RouteNode>();
  missingLayouts = current;
  skippedLayouts = skipped;
  try {
    return { value: fn(), missing: [...current] };
  } finally {
    [missingLayouts, skippedLayouts] = previous;
  }
}

/** Loads the layouts and returns the ones that failed to load. */
export async function loadLayouts(nodes: RouteNode[]): Promise<RouteNode[]> {
  const loaded = await Promise.all(nodes.map(loadSingleLayout));
  return nodes.filter((_, index) => !loaded[index]);
}

/** Loads the layout and returns whether it loaded. */
async function loadSingleLayout(node: RouteNode): Promise<boolean> {
  try {
    loadedLayouts.set(node, await node.loadRoute());
    return true;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `Expo Router could not load the layout "${node.contextKey}" to read its \`unstable_settings.anchor\`, so the anchor is skipped. Check the network connection and that the bundler is running.`,
        error
      );
    }
    return false;
  }
}

/** Runs `fn` again after each load until no layout it needs is missing. */
export function withLoadedLayouts<T>(
  fn: () => T,
  skipped: ReadonlySet<RouteNode> = new Set()
): T | Promise<T> {
  const { value, missing } = collectMissingLayouts(fn, skipped);
  return missing.length === 0
    ? value
    : loadLayouts(missing).then((failed) =>
        withLoadedLayouts(fn, new Set([...skipped, ...failed]))
      );
}

function readAnchor(node: RouteNode, settings: Record<string, any> | undefined) {
  const groupName = node.groupName;
  let anchor = getRouteNamedLikeGroup(node);
  let anchorGroupName: string | undefined;
  if (settings) {
    try {
      warnIfInitialRouteNameIsUsed(settings, groupName);
      anchor = settings.anchor ?? settings.initialRouteName ?? anchor;
    } catch (error) {
      if (error instanceof Error && !error.message.match(/You cannot dot into a client module/)) {
        throw error;
      }
    }

    if (groupName) {
      const groupAnchor = settings[groupName]?.anchor ?? settings[groupName]?.initialRouteName;
      anchor = groupAnchor ?? anchor;
      anchorGroupName = groupAnchor ? groupName : undefined;
    }
  }
  if (!anchor) {
    return undefined;
  }
  const route =
    node.children.find((child) => child.route === anchor) ??
    node.children.find((child) => child.route === `${anchor}/index`);
  if (!route) {
    throw new Error(
      `The initial route name "${anchor}"${anchorGroupName ? ` for group "${anchorGroupName}"` : ''} was not found in the layout at "${node.contextKey}". ` +
        `Available routes are: ${node.children.map(({ route }) => `"${route}"`).join(', ')}. ` +
        'Set `unstable_settings.anchor` to the name of a route in this layout.'
    );
  }
  return route.route;
}

function warnIfInitialRouteNameIsUsed(
  settings: Record<string, any>,
  groupName: string | undefined
) {
  if (
    process.env.NODE_ENV !== 'production' &&
    (settings.initialRouteName !== undefined ||
      settings[groupName ?? '']?.initialRouteName !== undefined)
  ) {
    console.warn(
      '`unstable_settings.initialRouteName` is deprecated. Use `unstable_settings.anchor` instead.'
    );
  }
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof value.then === 'function'
  );
}
