// @ref llp/0005-runtime-loop-tools.rfc.md §Verifying the route
// Deciding whether a route is real before a device is told to open it.
//
// The finding this answers [observed — friction run 3, F32, 2026-08-23]: `navigate
// /totally-bogus-route-xyz` exited 0, and so did `runtime:errors --fail-on-error` and `dev:wait
// --require-app` after it, while the simulator sat on Expo Router's "Unmatched Route" screen. An
// unmatched route is not an error the app *reports* — the router renders a screen for it, which is
// exactly what it is supposed to do — so no runtime gate can ever see it. The check has to happen
// before the link is opened, against the route table (`src/project/routes.ts`).
//
// Pure: the table and the route go in, a verdict comes out, and `navigateAsync` decides what to do
// with it.

import { PROGRAM_PREFIX } from '../programName';
import { matchProjectRoute, type ProjectRouteTable } from '../project/routes';
import { CommandError } from '../utils/errors';

/** How many routes the failure lists before it starts counting instead. */
const MAX_LISTED_ROUTES = 24;

/**
 * Machine shape of the route check, inside `@expo/agent-cli navigate --json`.
 *
 * `checked` is exactly `ok != null` and `reason` is present exactly when `ok` is null, so the
 * three keys read as one fact — the discipline llp/0010 §Other gates, in brief settled
 * for `dev:wait`'s bundle check.
 */
export interface RouteCheckJson {
  /** The route was compared against the project's routes. */
  checked: boolean;
  /** The project has a route that answers it. Null when the comparison was not made. */
  ok: boolean | null;
  /** The route of the table that answers it, e.g. `/users/[id]`. Null when none does. */
  matched: string | null;
  /** How many routes the table held. Zero when it could not be read. */
  routeCount: number;
  /** Why the comparison was not made. Null when it was. */
  reason: string | null;
}

export interface CheckRouteParams {
  /** The route as the caller wrote it. */
  route: string;
  /** The project's routes, as read from disk. */
  table: ProjectRouteTable;
  /** False when the check is not to run — `--no-route-check`, or nothing to check. */
  enabled: boolean;
  /**
   * Why the check is disabled, when `enabled` is false for a reason other than `--no-route-check`.
   * A reload with no `--route` has no route to check, and reporting the flag the caller never
   * passed would be a false attribution.
   */
  disabledReason?: string;
  /** True when the route was already a full URL, which addresses an app rather than this project. */
  isFullUrl: boolean;
}

/**
 * Compare a route against the project's routes.
 *
 * Fails open in every case where the answer is not knowable: `--no-route-check`, a full URL, and a
 * project whose route table could not be read. The reasoning is the one llp/0010 §An empty target list is inconclusive
 * ask about the _project_ settled for the bundle check — a false red costs more than the false
 * green it replaces, because it stops a command that would have worked and names no fix.
 */
export function checkRoute({
  route,
  table,
  enabled,
  disabledReason,
  isFullUrl,
}: CheckRouteParams): RouteCheckJson {
  const unchecked = (reason: string): RouteCheckJson => ({
    checked: false,
    ok: null,
    matched: null,
    routeCount: table.routes.length,
    reason,
  });

  if (!enabled) {
    return unchecked(disabledReason ?? 'the route check was not run (--no-route-check)');
  }
  if (isFullUrl) {
    return unchecked(
      'the route was already a full URL, which names an app rather than a route of this project'
    );
  }
  if (table.reason != null) {
    return unchecked(table.reason);
  }

  const match = matchProjectRoute(table.routes, route);
  return {
    checked: true,
    ok: match.ok,
    matched: match.matched,
    routeCount: table.routes.length,
    reason: null,
  };
}

/**
 * The commands that check a route, and how each of them takes one on a command line.
 *
 * The `Try:` line of this failure is what a driving agent runs next, so it has to be the command
 * the caller was already running. `runtime:reload --route /nope` used to be answered with
 * `npx @expo/agent-cli navigate /notes` [observed — friction run 5], which corrects the route and drops
 * the reload — and the reload was the point: `navigate` opens a route in the app that is running,
 * while `runtime:reload --route` puts the app back on the code that is on disk first.
 */
const ROUTE_COMMANDS = {
  navigate: (route: string) => `${PROGRAM_PREFIX} navigate ${route}`,
  'runtime:reload': (route: string) => `${PROGRAM_PREFIX} runtime:reload --route ${route}`,
  smoke: (route: string) => `${PROGRAM_PREFIX} smoke --route ${route}`,
} as const;

/** A command that resolves a route against the project's routes before it acts on one. */
export type RouteCommand = keyof typeof ROUTE_COMMANDS;

/**
 * The failure for a route the project has not got.
 *
 * Exit `1`, not the `20` band: nothing was opened and nothing was attempted, so this is the caller
 * having named something that does not exist — a usage error, which is what `1` is for
 * (llp/0010 §Exit codes).
 */
export function routeNotFoundError(
  route: string,
  table: ProjectRouteTable,
  { platform, command = 'navigate' }: { platform?: string; command?: RouteCommand } = {}
): CommandError {
  const routes = table.routes.map((entry) => entry.route);
  const shown = routes.slice(0, MAX_LISTED_ROUTES);
  const listing =
    routes.length > shown.length
      ? `${shown.join(', ')} (and ${routes.length - shown.length} more)`
      : shown.join(', ');
  const nearest = nearestRoute(route, routes);

  const error = new CommandError(
    'ROUTE_NOT_FOUND',
    [
      `"${route}" is not a route of this project, so nothing was opened${platform ? ` on ${platform}` : ''}.`,
      `Why: Expo Router builds the routes from the files under ${table.routerRoot}, and none of the ${routes.length} it found there answers that path. Opening it anyway lands the app on the router's "Unmatched Route" screen, which is a screen and not an error — so nothing that reads the running app would have reported it either.`,
      `How: ${nearest != null ? `did you mean "${nearest}"? ` : ''}The routes this project has are: ${listing}. A route you have just added has to exist as a file before it can be opened. Pass --no-route-check to open the link without this check.`,
    ].join('\n')
  );
  error.suggestedCommand = ROUTE_COMMANDS[command](nearest ?? '/');
  return error;
}

/**
 * The route closest to what was asked for, or null when nothing is close.
 *
 * A typo is the common case — `/note` for `/notes` — and the last line of a failure is what a
 * driving agent acts on, so a name it can paste beats a list it has to read. The cutoff keeps a
 * confident wrong guess out: a suggestion has to be within a third of the route's length.
 */
export function nearestRoute(route: string, routes: readonly string[]): string | null {
  let best: string | null = null;
  let bestDistance = Infinity;
  for (const candidate of routes) {
    const distance = editDistance(route, candidate);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  if (best == null) {
    return null;
  }
  return bestDistance <= Math.max(1, Math.floor(Math.max(route.length, best.length) / 3))
    ? best
    : null;
}

/** Levenshtein distance, over two rows rather than a full matrix. */
function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j]! + 1,
        current[j - 1]! + 1,
        previous[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    previous = current;
  }
  return previous[b.length]!;
}
