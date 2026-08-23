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

import fs from 'fs';
import path from 'path';

import { normalizeDevServerUrl, probeDevServerAsync } from './devServer';

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
    const response = await fetch(url, { signal: controller.signal });
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
}

export interface AppConnectionResult {
  /** Debugger targets the dev server reported, i.e. apps attached to it. */
  appsConnected: number;
  /** The wait expired with no app attached. */
  timedOut: boolean;
  /** How long the wait took, in milliseconds. */
  waitedMs: number;
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
  { timeoutMs, intervalMs = 250 }: WaitForAppConnectionOptions
): Promise<AppConnectionResult> {
  const startedAt = Date.now();
  const deadline = startedAt + timeoutMs;

  for (;;) {
    const probe = await probeDevServerAsync(devServerUrl);
    if (probe.targets.length > 0) {
      return {
        appsConnected: probe.targets.length,
        timedOut: false,
        waitedMs: Date.now() - startedAt,
      };
    }
    if (Date.now() + intervalMs >= deadline) {
      return { appsConnected: 0, timedOut: true, waitedMs: Date.now() - startedAt };
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
  let resolved = path.resolve(value);
  try {
    resolved = fs.realpathSync(resolved);
  } catch {
    // A path that does not exist here — the dev server may be on another host — compares as typed.
  }
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

/** Fit an unexpected answer on one line, so a stray HTML page does not become the error. */
function excerpt(body: string): string {
  const line = body.split('\n')[0]!;
  return line.length > BODY_EXCERPT_LENGTH ? `${line.slice(0, BODY_EXCERPT_LENGTH)}…` : line;
}
