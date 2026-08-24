// @ref llp/0005-runtime-loop-tools.rfc.md §Verifying the route
// The routes this project has, read the way Expo Router reads them: from the files.
//
// Why the files, and not the dev server. Nothing the dev server serves answers "what routes does
// this app have" for a native target [observed — 2026-08-23]: `/status` reports the bundler,
// `/json/list` reports debugger targets, and the only routes manifest in the family
// (`@expo/router-server`'s `createRoutesManifest`, reached from `MetroBundlerDevServer`) describes
// **web and API** routes and is only reachable by importing internals that llp/0001 §Constraints
// item 5 forbids. `_sitemap` is a screen the *app* renders, so asking it needs a healthy connected
// app — which is precisely what is missing when a route check is worth running. The typed-routes
// declaration (`.expo/types/router.d.ts`) is generated from this same scan and only when
// `experiments.typedRoutes` is on.
//
// So this re-reads the conventions rather than the route table, and it is written against their
// source: `expo-router/src/matchers.tsx` and `expo-router/src/getRoutesCore.ts` [observed —
// 2026-08-23]. It is deliberately a *cheap* reading — it never opens a file, only names one — so
// it can be wrong in one direction and must fail open when it is unsure.

import fs from 'fs';
import path from 'path';

import { directoryExistsAsync } from '../utils/dir';
import { readJsonFileAsync } from './nodeModules';

/** Extensions Metro resolves for a route module. */
const ROUTE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

/** Platform suffixes a route file may carry, which do not change the route it answers. */
const PLATFORM_SUFFIXES = ['ios', 'android', 'native', 'web'];

/**
 * The sitemap screen Expo Router generates for every project with routes
 * [observed — `getRoutesCore.ts`, which adds `_sitemap` when the directory has no file for it].
 * It is a real destination, so leaving it out would reject a route that works.
 */
const GENERATED_ROUTES = ['/_sitemap'];

/** Directories a router root never has routes in. */
const IGNORED_DIRECTORIES = new Set(['node_modules', '.git', '.expo']);

/** How deep the scan walks, so a symlink loop cannot become a hang. */
const MAX_SCAN_DEPTH = 12;

export interface ProjectRoute {
  /** The URL path, as an agent would pass it: `/notes`, `/users/[id]`, `/`. */
  route: string;
  /** The file that answers it, relative to the project root. */
  file: string;
  /** The route has at least one dynamic segment, so it matches a pattern rather than a literal. */
  dynamic: boolean;
}

export interface ProjectRouteTable {
  /** The router directory, relative to the project root, or null when the project has none. */
  routerRoot: string | null;
  /** Every route the project has, sorted by path. */
  routes: ProjectRoute[];
  /**
   * Why the table is empty, or null when it was read.
   *
   * Present exactly when {@link routes} is empty, so a caller reads one fact instead of two — the
   * same rule `dev:wait`'s `bundle.checked`/`bundle.ok` pair follows (llp/0010).
   */
  reason: string | null;
}

export interface ProjectRouteMatch {
  /** The project has a route that answers the path. */
  ok: boolean;
  /** The route that answers it, as written in the table. Null when none does. */
  matched: string | null;
}

/**
 * Read every route of the project.
 *
 * Never throws. A project with no router directory, and a router directory with no route files,
 * are both answers with a `reason` — not failures — because a wrapper that cannot read a route
 * table has learned nothing about the route it was asked about.
 */
export async function readProjectRoutesAsync(projectRoot: string): Promise<ProjectRouteTable> {
  const routerRoot = await resolveRouterRootAsync(projectRoot);
  if (routerRoot == null) {
    return {
      routerRoot: null,
      routes: [],
      reason: 'this project has no app directory, so it does not use Expo Router',
    };
  }

  const files = await listRouteFilesAsync(path.join(projectRoot, routerRoot));
  const byRoute = new Map<string, ProjectRoute>();
  for (const file of files) {
    const route = routeFromFile(file);
    if (route == null) {
      continue;
    }
    // Two files can answer one route — `settings.ios.tsx` and `settings.android.tsx` — and the
    // route is what this table is about, so the first file that produced it is the one named.
    if (!byRoute.has(route)) {
      byRoute.set(route, {
        route,
        file: toPosix(path.join(routerRoot, file)),
        dynamic: isDynamicRoute(route),
      });
    }
  }

  if (byRoute.size === 0) {
    return { routerRoot, routes: [], reason: 'the app directory holds no route files' };
  }

  for (const generated of GENERATED_ROUTES) {
    if (!byRoute.has(generated)) {
      byRoute.set(generated, { route: generated, file: 'expo-router', dynamic: false });
    }
  }

  const routes = [...byRoute.values()].sort((a, b) => a.route.localeCompare(b.route));
  return { routerRoot, routes, reason: null };
}

/**
 * Whether the project has a route that answers a path.
 *
 * Literal routes are tried before dynamic ones, so `/users/me` matches its own file rather than
 * `/users/[id]` when the project has both.
 */
export function matchProjectRoute(
  routes: readonly ProjectRoute[],
  requested: string
): ProjectRouteMatch {
  const normalized = normalizeRequestedRoute(requested);

  const literal = routes.find((route) => !route.dynamic && route.route === normalized);
  if (literal) {
    return { ok: true, matched: literal.route };
  }

  for (const route of routes) {
    if (!route.dynamic) {
      continue;
    }
    // A caller that names the pattern itself — `/users/[id]` — means the route, not a value.
    if (route.route === normalized || routePattern(route.route).test(normalized)) {
      return { ok: true, matched: route.route };
    }
  }

  return { ok: false, matched: null };
}

/**
 * Where the routes live, relative to the project root.
 *
 * Mirrors `getRouterDirectoryModuleIdWithManifest` + `getRouterDirectory` [observed —
 * `packages/@expo/cli/src/start/server/metro/router.ts`]: a configured root wins, then `src/app`,
 * then `app`. A configured root that does not exist is still the answer — the project says that is
 * where its routes are, and reporting `app` instead would describe another directory's files.
 */
async function resolveRouterRootAsync(projectRoot: string): Promise<string | null> {
  const configured = await readConfiguredRouterRootAsync(projectRoot);
  if (configured != null) {
    return configured;
  }
  if (await directoryExistsAsync(path.join(projectRoot, 'src', 'app'))) {
    return 'src/app';
  }
  if (await directoryExistsAsync(path.join(projectRoot, 'app'))) {
    return 'app';
  }
  return null;
}

/**
 * The router root named in the static app config, from either place it can be written.
 *
 * `extra.router.root` is where the resolved config carries it, and the `expo-router` plugin's
 * options are where a project usually writes it — the plugin copies the second into the first, and
 * this reads a config nobody resolved. A dynamic `app.config.js` is never evaluated, per the
 * process boundary; such a project falls through to the directory defaults.
 */
async function readConfiguredRouterRootAsync(projectRoot: string): Promise<string | null> {
  for (const file of ['app.json', 'app.config.json']) {
    const contents = await readJsonFileAsync<Record<string, any>>(path.join(projectRoot, file));
    if (contents == null) {
      continue;
    }
    const expo = (contents.expo ?? contents) as Record<string, any>;
    const fromExtra = nonEmptyString(expo?.extra?.router?.root);
    if (fromExtra != null) {
      return toPosix(fromExtra);
    }
    for (const plugin of Array.isArray(expo?.plugins) ? expo.plugins : []) {
      if (Array.isArray(plugin) && plugin[0] === 'expo-router') {
        const fromPlugin = nonEmptyString((plugin[1] as Record<string, unknown> | undefined)?.root);
        if (fromPlugin != null) {
          return toPosix(fromPlugin);
        }
      }
    }
    return null;
  }
  return null;
}

/** Every module file under the router root, as posix paths relative to it. */
async function listRouteFilesAsync(routerRoot: string, depth = 0): Promise<string[]> {
  if (depth > MAX_SCAN_DEPTH) {
    return [];
  }
  let entries: fs.Dirent[];
  try {
    entries = await fs.promises.readdir(routerRoot, { withFileTypes: true });
  } catch {
    return [];
  }

  const files: string[] = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }
      const nested = await listRouteFilesAsync(path.join(routerRoot, entry.name), depth + 1);
      files.push(...nested.map((file) => `${entry.name}/${file}`));
    } else if (ROUTE_EXTENSIONS.includes(path.extname(entry.name))) {
      files.push(entry.name);
    }
  }
  return files;
}

/**
 * The route a file answers, or null when the file is not a route.
 *
 * The exclusions follow `isTypedRoute` [observed — `expo-router/src/matchers.tsx`]: `_layout`, and
 * any file with a `+` in its last segment. That covers `+html`, `+native-intent`, `+middleware`,
 * every `*+api` route — and `+not-found`, deliberately. `+not-found` is the screen an unmatched
 * path already lands on, so counting it as a destination would make every route resolve, which is
 * the bug this table exists to catch.
 */
function routeFromFile(file: string): string | null {
  const segments = file.split('/');
  const name = withoutExtension(segments[segments.length - 1]!);
  if (name === '_layout' || name.includes('+')) {
    return null;
  }

  segments[segments.length - 1] = name;
  const visible = segments
    .filter((segment) => matchGroupName(segment) == null)
    .filter((segment) => segment.length > 0);

  if (visible[visible.length - 1] === 'index') {
    visible.pop();
  }

  return `/${visible.join('/')}`.replace(/\/{2,}/g, '/').replace(/(.)\/$/, '$1');
}

/** Strip the module extension, and the platform suffix under it. */
function withoutExtension(name: string): string {
  const base = name.replace(/\.[jt]sx?$/, '');
  const platform = base.match(/\.([^.]+)$/)?.[1];
  return platform != null && PLATFORM_SUFFIXES.includes(platform)
    ? base.slice(0, -(platform.length + 1))
    : base;
}

/** `(tabs)` -> `tabs`, per `matchGroupName` in `expo-router/src/matchers.tsx`. */
function matchGroupName(name: string): string | undefined {
  return name.match(/^(?:[^\\()])*?\(([^\\/]+)\)/)?.[1];
}

function isDynamicRoute(route: string): boolean {
  return /\[[^\]]+\]/.test(route);
}

/**
 * A requested route as it will be compared: no query, no fragment, no trailing slash, no group
 * segments, and percent-decoded.
 *
 * Group segments come off because both spellings address the same screen — `/(tabs)/explore` and
 * `/explore` — and the table stores the visible one.
 */
function normalizeRequestedRoute(requested: string): string {
  const withoutQuery = requested.split('#')[0]!.split('?')[0]!;
  const decoded = safeDecode(withoutQuery);
  const segments = decoded
    .split('/')
    .filter((segment) => segment.length > 0 && matchGroupName(segment) == null);
  return `/${segments.join('/')}`;
}

/** A route pattern as a regex: `[id]` matches one segment, `[...rest]` matches the rest. */
function routePattern(route: string): RegExp {
  const source = route
    .split('/')
    .map((segment) => {
      if (/^\[\.\.\..+\]$/.test(segment)) {
        return '.+';
      }
      if (/^\[.+\]$/.test(segment)) {
        return '[^/]+';
      }
      return escapeRegExp(segment);
    })
    .join('/');
  return new RegExp(`^${source}$`);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function toPosix(value: string): string {
  return value.split(path.sep).join('/');
}

function nonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
