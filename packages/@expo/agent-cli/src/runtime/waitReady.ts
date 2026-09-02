// @ref llp/0005-runtime-loop-tools.rfc.md
// "Has the bundler finished, and is it *my* bundler?" — the one question nothing else in this CLI
// could answer.
//
// `probeDevServerAsync` hits `/json/list`, which a dev server answers as soon as it listens, long
// before the first bundle exists. The readiness primitive is `GET /status` instead: the Expo dev
// server flushes its headers, awaits the bundler, and only then writes `packager-status:running`
// [observed — `packages/@expo/cli/src/start/server/metro/dev-server/createMetroMiddleware.ts`], so
// the request itself is the wait. That is why this issues **one long-lived request** rather than
// polling: a poll would abandon a wait that was already nearly over and start it again.
//
// The flushed headers carry `X-React-Native-Project-Root`, which is the only evidence over the wire
// that the dev server that answered belongs to this project — the caveat `discoverDevServerAsync`
// documents but cannot close.

import type { NavigatePlatform } from '../navigate/device';
import { canonicalizeExistingPath } from '../utils/dir';
import { normalizeDevServerUrl, probeDevServerAsync } from './devServer';
import {
  buildDeviceNameIndexIfNeededAsync,
  scopeTargets,
  type DeviceNameIndex,
} from './targetPlatform';

/** The body `GET /status` answers with once the bundler has finished. */
export const PACKAGER_STATUS_READY = 'packager-status:running';

/** Header the dev server names the project root it serves in, URI-encoded. */
export const PROJECT_ROOT_HEADER = 'x-react-native-project-root';

/** How much of an unexpected `/status` body is quoted back in the reason. */
const BODY_EXCERPT_LENGTH = 80;

export interface WaitForBundlerReadyOptions {
  /** How long the request may take before it is aborted, in milliseconds. */
  timeoutMs: number;
  /** Project to compare the dev server's own project root against; null skips the comparison. */
  projectRoot?: string | null;
  /** Cancel the wait from outside, e.g. a budget shared with an earlier phase. */
  signal?: AbortSignal;
}

export interface BundlerReadyResult {
  /** The dev server answered `packager-status:running`, so the bundler is done. */
  ready: boolean;
  /**
   * Whether the dev server serves this project.
   *
   * Null when it cannot be decided: no project root was given, or the dev server named none.
   * `false` is a real answer — another project's Metro on the port this one was looked for on.
   */
  projectRootMatched: boolean | null;
  /** The project root the dev server named, decoded, or null when it named none. */
  reportedProjectRoot: string | null;
  /** The wait expired before the dev server answered. */
  timedOut: boolean;
  /** How long the wait took, in milliseconds. */
  waitedMs: number;
  /** Why readiness could not be confirmed. Absent when {@link ready} is true. */
  reason?: string;
}

/**
 * Wait for the dev server to finish bundling, and check whether it is this project's.
 *
 * Never throws: an unreachable dev server, a wrong answer and an expired budget are all results a
 * command has to report differently, and an exception would flatten them into one.
 */
export async function waitForBundlerReadyAsync(
  devServerUrl: string,
  { timeoutMs, projectRoot, signal }: WaitForBundlerReadyOptions
): Promise<BundlerReadyResult> {
  const url = `${normalizeDevServerUrl(devServerUrl)}/status`;
  const startedAt = Date.now();

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  // An unreferenced timer never keeps the process alive on its own.
  timer.unref?.();
  const abortFromCaller = () => controller.abort();
  signal?.addEventListener('abort', abortFromCaller, { once: true });

  // Held outside the try because the headers arrive before the body does: a request that goes on
  // to expire has already answered "whose dev server is this", and that answer must survive the
  // abort. It is the whole reason a request that times out is still worth reporting.
  let reported: string | null = null;
  let projectRootMatched: boolean | null = null;

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { connection: 'close' },
    });
    reported = decodeProjectRoot(response.headers.get(PROJECT_ROOT_HEADER));
    projectRootMatched = matchProjectRoot(reported, projectRoot);
    const body = (await response.text()).trim();

    if (!response.ok) {
      return {
        ready: false,
        projectRootMatched,
        reportedProjectRoot: reported,
        timedOut: false,
        waitedMs: Date.now() - startedAt,
        reason: `${url} answered ${response.status} ${response.statusText}`,
      };
    }
    if (body !== PACKAGER_STATUS_READY) {
      return {
        ready: false,
        projectRootMatched,
        reportedProjectRoot: reported,
        timedOut: false,
        waitedMs: Date.now() - startedAt,
        reason: `${url} answered "${excerpt(body)}" instead of "${PACKAGER_STATUS_READY}", so it is not an Expo dev server`,
      };
    }

    return {
      ready: true,
      projectRootMatched,
      reportedProjectRoot: reported,
      timedOut: false,
      waitedMs: Date.now() - startedAt,
    };
  } catch (error: unknown) {
    return {
      ready: false,
      projectRootMatched,
      reportedProjectRoot: reported,
      timedOut,
      waitedMs: Date.now() - startedAt,
      reason: timedOut
        ? `${url} did not answer "${PACKAGER_STATUS_READY}" within ${timeoutMs}ms, so the bundler was still working`
        : error instanceof Error
          ? error.message
          : String(error),
    };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abortFromCaller);
  }
}

export interface WaitForAppConnectionOptions {
  /** How long to keep asking, in milliseconds. */
  timeoutMs: number;
  /** How long to wait between two target-list reads. */
  intervalMs?: number;
  /**
   * Count only apps on this platform, instead of every app attached.
   *
   * The fix for friction run 6's F51: with an iOS simulator and an Android emulator on one dev
   * server, `--android` waits used to be satisfied by the simulator, and every phase after them
   * read the wrong runtime.
   */
  platform?: NavigatePlatform;
  /** What this machine's device tools reported, for {@link platform}. */
  deviceIndex?: DeviceNameIndex;
}

export interface AppConnectionResult {
  /**
   * Apps attached to the dev server that this wait counted.
   *
   * Scoped when a platform was named: it is the number of apps *on that platform*.
   */
  appsConnected: number;
  /** The wait expired with no app attached. */
  timedOut: boolean;
  /** How long the wait took, in milliseconds. */
  waitedMs: number;
  /**
   * Apps attached that are on another platform, when one was named.
   *
   * Reported rather than dropped, because it is the difference between "no app is running" and
   * "the app that is running is the other platform's" — which are opposite next steps.
   */
  otherPlatformApps?: number;
  /** Apps attached whose platform nothing in the target decided. Never counted as either. */
  undeterminedApps?: number;
}

/**
 * Wait for at least one app to attach to the dev server.
 *
 * A poll, unlike the readiness wait above: the debugger target list is a snapshot with no
 * long-poll form, so there is nothing to hold a request open on. The first read happens before any
 * sleeping, so an app that is already attached costs one request.
 */
export async function waitForAppConnectionAsync(
  devServerUrl: string,
  { timeoutMs, intervalMs = 250, platform, deviceIndex }: WaitForAppConnectionOptions
): Promise<AppConnectionResult> {
  const startedAt = Date.now();
  const deadline = startedAt + timeoutMs;
  // Read once, before the loop: what is attached changes during the wait, what this machine has
  // does not, and asking the device tools on every poll would be a subprocess every 250 ms.
  const index =
    platform == null
      ? null
      : (deviceIndex ??
        (await buildDeviceNameIndexIfNeededAsync(
          (
            await probeDevServerAsync(devServerUrl)
          ).targets
        )));

  for (;;) {
    const probe = await probeDevServerAsync(devServerUrl);
    const scoped = platform == null ? null : scopeTargets(probe.targets, platform, index!);
    const counted = scoped ? scoped.matched.length : probe.targets.length;
    const extra = scoped
      ? {
          otherPlatformApps: scoped.otherPlatform.length,
          undeterminedApps: scoped.undetermined.length,
        }
      : {};

    if (counted > 0) {
      return {
        appsConnected: counted,
        timedOut: false,
        waitedMs: Date.now() - startedAt,
        ...extra,
      };
    }
    if (Date.now() + intervalMs >= deadline) {
      return { appsConnected: 0, timedOut: true, waitedMs: Date.now() - startedAt, ...extra };
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

export interface WaitForFreshAppConnectionOptions extends WaitForAppConnectionOptions {
  /**
   * Debugger target ids the dev server listed *before* the app was reloaded.
   *
   * Empty means nothing was attached, in which case every target is new by definition — which is
   * the `--method device` case where "reload" and "start" are the same act.
   */
  knownTargetIds: readonly string[];
  /**
   * Stop the wait from outside, for a caller watching a second proof at the same time.
   *
   * `runtime:reload` watches this list *and* the dev server's own output, on every rung: some apps
   * register no target at all (a cloud simulator), and a relaunched app can come back under the page
   * id it had before. Whichever answers first ends both waits: running this one out to its budget
   * spent 90 s of a billed session on a reload the log had already proved, and 30 s of a local one
   * [both observed — 2026-08-27, live].
   */
  signal?: AbortSignal;
}

export interface FreshAppConnectionResult extends AppConnectionResult {
  /**
   * Targets the dev server listed that it had not listed before the reload.
   *
   * The only number a reload may be called a success on. `appsConnected` is kept beside it because
   * the two answer different questions, and their difference is the diagnosis: one connected and
   * zero fresh is an app that never acted on the broadcast, and zero of both is an app that went.
   */
  freshTargets: number;
}

/**
 * Wait for a debugger target the dev server had *not* listed before, i.e. for the app's JavaScript
 * runtime to register again after a reload.
 *
 * The difference from {@link waitForAppConnectionAsync} is the whole fix for friction run 4's F39
 * and F45. A reloading app's old target stays in `/json/list` for about half a second after the
 * broadcast [observed — 2026-08-23, notesapp on SDK 57 in Expo Go on iOS, port 8190: the target id
 * went `8a9d…-1` -> `8a9d…-2` at 761 ms, and the pre-reload id was still being served at 506 ms].
 * A wait that returns on the first non-empty list therefore returns on the *old* runtime, which is
 * why `runtime:reload` reported `appsConnected: 1` for an app that had quit (F45) and why
 * `runtime:errors` immediately afterwards could not find a target to talk to (F39).
 *
 * Metro's page ids come from a per-device counter, so a re-registered page is a new id rather than
 * the same one — the same never-reused-id property the message socket's peer churn relies on.
 */
export async function waitForFreshAppConnectionAsync(
  devServerUrl: string,
  { timeoutMs, intervalMs = 250, knownTargetIds, signal }: WaitForFreshAppConnectionOptions
): Promise<FreshAppConnectionResult> {
  const startedAt = Date.now();
  const deadline = startedAt + timeoutMs;
  const known = new Set(knownTargetIds);
  let appsConnected = 0;

  for (;;) {
    const probe = await probeDevServerAsync(devServerUrl);
    appsConnected = probe.targets.length;
    const fresh = probe.targets.filter((target) => !known.has(target.id));
    if (fresh.length > 0) {
      return {
        appsConnected,
        freshTargets: fresh.length,
        timedOut: false,
        waitedMs: Date.now() - startedAt,
      };
    }
    // A caller watching a second proof has had it answered, so this one has nothing left to
    // decide. The counts are what the last read said, and `timedOut` is false: the budget did not
    // run out, the question was settled elsewhere.
    if (signal?.aborted) {
      return { appsConnected, freshTargets: 0, timedOut: false, waitedMs: Date.now() - startedAt };
    }
    if (Date.now() + intervalMs >= deadline) {
      return { appsConnected, freshTargets: 0, timedOut: true, waitedMs: Date.now() - startedAt };
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

/** The header value, URI-decoded, or null when the dev server sent none. */
function decodeProjectRoot(value: string | null): string | null {
  if (value == null) {
    return null;
  }
  try {
    return decodeURI(value);
  } catch {
    // A value that is not a valid encoding is still the answer the dev server gave.
    return value;
  }
}

/**
 * Whether the dev server's project root and this project's are the same directory.
 *
 * Both sides are resolved through the filesystem when they exist, because a temporary directory is
 * commonly reached through a symlink (`/var` -> `/private/var` on macOS) and two spellings of one
 * directory must not read as two projects. Windows path comparison is case-insensitive.
 */
function matchProjectRoot(reported: string | null, projectRoot?: string | null): boolean | null {
  if (reported == null || projectRoot == null) {
    return null;
  }
  return canonicalPath(reported) === canonicalPath(projectRoot);
}

function canonicalPath(value: string): string {
  const resolved = canonicalizeExistingPath(value);
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

/** Fit an unexpected answer on one line, so a stray HTML page does not become the error. */
function excerpt(body: string): string {
  const line = body.split('\n')[0]!;
  return line.length > BODY_EXCERPT_LENGTH ? `${line.slice(0, BODY_EXCERPT_LENGTH)}…` : line;
}
