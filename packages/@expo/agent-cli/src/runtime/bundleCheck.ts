// @ref llp/0010-agent-conventions.rfc.md §Other gates, in brief
// "Does this project's own code still compile?" — the question `GET /status` cannot answer.
//
// `/status` proves the bundler process is alive. It says nothing about the project, so an agent
// that had just broken the build could ask four different health commands and get four green
// answers. The bundler knows: its `.bundle` endpoint answers HTTP 500 with a structured
// `TransformError` [observed — `metro/src/Server.js` `_processBundleRequest`, and live against an
// SDK 57 app on 2026-08-23].
//
// Two HTTP requests, and no `@expo/cli` import (llp/0001 constraint 5):
//
//  1. The **manifest** at `GET /`, with `expo-platform` and `Accept: application/json`, whose
//     `launchAsset.url` is the entry bundle URL the dev server would hand a real app [observed —
//     `packages/@expo/cli/src/start/server/middleware/ExpoGoManifestHandlerMiddleware.ts`]. Asking
//     for it is what keeps the entry path out of this file: it is `node_modules/expo-router/entry`
//     for a router app and `index` for a plain one, and the dev server is the only thing that knows
//     which, along with the whole query string the graph is keyed by.
//
//     **The web target answers the same question with a different document.** There is no manifest:
//     `GET /` is the page a browser loads, and the entry bundle is the `<script src>` the dev
//     server appends to it [observed — `ManifestMiddleware.getSingleHtmlTemplateAsync` calls
//     `appendScriptsToHtml(contents, [this.getWebBundleUrl()])`, and live on 2026-08-23:
//     `<script src="/node_modules/expo-router/entry.bundle?platform=web&…" defer></script>`]. So
//     the *source* of the URL differs by platform and everything after it does not. Asking for JSON
//     and reading the HTML answer as a parse failure is what left `--platform web` reporting
//     `checked: true, ok: null` with a `SyntaxError` for a reason [observed — friction run 2].
//  2. A **HEAD** of that exact URL. HEAD builds the bundle and reports the real status without
//     sending the 8 MB body [observed — Metro treats it as a normal request and only annotates it
//     as a prefetch]; the body is only fetched when the status says something went wrong. The URL
//     is used byte for byte, because every query parameter is part of Metro's graph id and changing
//     one would compile a second graph rather than read the one the app uses.

import { stripVTControlCharacters } from 'util';

import type { CdpTarget } from './cdpClient';
import { normalizeDevServerUrl } from './devServer';

/** Platforms the bundle can be built for. The same set `expo-platform` accepts. */
export const BUNDLE_CHECK_PLATFORMS = ['ios', 'android', 'web'] as const;

export type BundleCheckPlatform = (typeof BUNDLE_CHECK_PLATFORMS)[number];

/**
 * Platform the check builds for when the caller names none.
 *
 * Fixed rather than derived from the host, unlike the plan engine's default: this compiles
 * JavaScript, and a syntax error is a syntax error on every platform, so a check that answered
 * differently on a Mac and on a Linux runner would only be harder to reason about. Every Expo
 * project can build for iOS; a project that deliberately cannot takes `--platform`.
 */
export const DEFAULT_BUNDLE_CHECK_PLATFORM: BundleCheckPlatform = 'ios';

/**
 * How the platform (or platforms) a check built for was decided.
 *
 * `default` is the honest label for "nothing decided it". It is reported rather than hidden,
 * because friction run 6's F53 was that fixed default being printed as though it were an answer
 * about the running app: an Android-only break, an iOS app also attached, and
 * `Bundle compiles · for ios` under a reload that put the Android app back on a red screen.
 */
export type BundlePlatformSource =
  /** The caller named it. */
  | 'flag'
  /** It is the platform (or platforms) of the apps connected to the dev server. */
  | 'connected-app'
  /** Nothing named one and no connected app could be placed, so {@link DEFAULT_BUNDLE_CHECK_PLATFORM} stands. */
  | 'default';

/**
 * Which platforms to build the entry bundle for.
 *
 * A named platform is used as named, always: the caller was specific. With none, the connected apps
 * decide — one platform is that platform, and **two are both**, because a project with a
 * `.android.ts` sibling of a broken file compiles for one and not the other, and answering for one
 * of two running apps is how a red screen went unreported (F53). With nothing connected, or nothing
 * that can be placed, the fixed default stands and the caller is told that it is a default.
 *
 * @param named the platform the caller named, or null when they named none.
 * @param targets the dev server's debugger targets, as `/json/list` reported them.
 */
export async function resolveBundleCheckPlatformsAsync(
  named: BundleCheckPlatform | null,
  targets: CdpTarget[],
  fallback: BundleCheckPlatform = DEFAULT_BUNDLE_CHECK_PLATFORM
): Promise<{ platforms: BundleCheckPlatform[]; source: BundlePlatformSource }> {
  if (named != null) {
    return { platforms: [named], source: 'flag' };
  }
  const { buildDeviceNameIndexIfNeededAsync, platformsOfTargets } =
    require('./targetPlatform') as typeof import('./targetPlatform');
  const { platforms } = platformsOfTargets(
    targets,
    await buildDeviceNameIndexIfNeededAsync(targets)
  );
  return platforms.length > 0
    ? { platforms, source: 'connected-app' }
    : { platforms: [fallback], source: 'default' };
}

/** What the bundler reported, reshaped into the fields worth acting on. */
export interface BundleCheckError {
  /**
   * Metro's own class for the failure, e.g. `TransformError` or `UnableToResolveError`.
   *
   * Native gets it from the bundler's own payload. Web has no such payload — see
   * {@link readErrorPageType} for how the same answer is derived from the error page — and both
   * ways may still end in `null`, which means "the dev server named no class", not "no class".
   */
  type: string | null;
  /**
   * File the bundler stopped in, relative to the project root whenever it is inside it.
   *
   * Project-relative on every platform: native names the file that way already and web names it
   * absolutely, and a consumer that parses one has to parse the other (F37). A file outside the
   * project stays absolute, for the same reason a stack frame outside it does — a `../../..`
   * prefix is not more useful than the path. Null when the bundler named no file.
   */
  filename: string | null;
  lineNumber: number | null;
  column: number | null;
  /** The error itself: the first line of Metro's message, without the frame or its ANSI codes. */
  message: string;
  /** The code frame Metro printed, ANSI stripped. Null when it printed none. */
  snippet: string | null;
}

/**
 * How the check ended.
 *
 * `unknown` is not a failure and is deliberately not folded into one: a dev server that answered
 * nothing this module understands has not shown the project to be broken, and a gate that went red
 * on it would be worse than the silence it replaced.
 */
export type BundleCheckOutcome =
  /** The entry bundle compiled. */
  | 'ok'
  /** The bundler answered with an error: the project's own code does not compile. */
  | 'broken'
  /** The budget expired before the bundler answered. */
  | 'timeout'
  /** The check could not be run at all. See {@link BundleCheckResult.reason}. */
  | 'unknown';

export interface BundleCheckResult {
  outcome: BundleCheckOutcome;
  platform: BundleCheckPlatform;
  /** Entry bundle URL that was fetched, or null when the manifest named none. */
  url: string | null;
  /** What the bundler reported. Present exactly when the outcome is `broken`. */
  error: BundleCheckError | null;
  /** Why the check could not decide. Present for `unknown` and `timeout`. */
  reason?: string;
  /** How long the whole check took, in milliseconds. */
  waitedMs: number;
}

export interface CheckEntryBundleOptions {
  /** Platform to build the entry bundle for. */
  platform: BundleCheckPlatform;
  /** How long both requests together may take before the check gives up. */
  timeoutMs: number;
  /**
   * Project the check is about, so an absolute `filename` can be reported relative to it.
   *
   * Optional: a caller that has no project root gets the path the dev server named, unchanged.
   */
  projectRoot?: string | null;
}

/** How much of an unparseable error body is quoted back. */
const BODY_EXCERPT_LENGTH = 200;

/**
 * Ask the dev server to build this project's entry bundle, and report whether it compiled.
 *
 * Never throws: a bundler that is broken, a manifest that cannot be read and a budget that expired
 * are three answers a caller has to act on differently, and an exception would flatten them.
 */
export async function checkEntryBundleAsync(
  devServerUrl: string,
  { platform, timeoutMs, projectRoot = null }: CheckEntryBundleOptions
): Promise<BundleCheckResult> {
  const startedAt = Date.now();
  const origin = normalizeDevServerUrl(devServerUrl);

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  // An unreferenced timer never keeps the process alive on its own.
  timer.unref?.();

  // One place, so the two platforms cannot end up reporting the same file two ways (F37).
  const finish = (result: Omit<BundleCheckResult, 'platform' | 'waitedMs'>): BundleCheckResult => ({
    ...result,
    error: result.error && {
      ...result.error,
      filename: relativizeFilename(result.error.filename, projectRoot),
    },
    platform,
    waitedMs: Date.now() - startedAt,
  });

  try {
    const entry = await readEntryBundleUrlAsync(origin, platform, controller.signal);
    // The web dev server renders the page on the server, so a project that does not compile is
    // reported by the page itself and there is no bundle left to ask about.
    if (entry.error) {
      return finish({ outcome: 'broken', url: null, error: entry.error });
    }
    if (entry.url == null) {
      return finish({ outcome: 'unknown', url: null, error: null, reason: entry.reason });
    }

    // HEAD, so a bundle that compiles costs a status line instead of megabytes of JavaScript.
    const head = await fetch(entry.url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { connection: 'close' },
    });
    if (head.ok || head.status === 304) {
      return finish({ outcome: 'ok', url: entry.url, error: null });
    }

    // Only now is the body worth having, and it is the small one: Metro answers a failed build
    // with a JSON object, not with a bundle.
    const body = await fetch(entry.url, { signal: controller.signal });
    return finish({
      outcome: 'broken',
      url: entry.url,
      error: await readBundleErrorAsync(body),
    });
  } catch (error: unknown) {
    if (timedOut) {
      return finish({
        outcome: 'timeout',
        url: null,
        error: null,
        reason: `the bundler did not finish building the entry bundle within ${timeoutMs}ms`,
      });
    }
    return finish({
      outcome: 'unknown',
      url: null,
      error: null,
      reason: error instanceof Error ? error.message : String(error),
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Where the entry bundle URL of one platform comes from, or why it could not be read. */
interface EntryBundleUrl {
  url: string | null;
  /** A diagnosis, never an exception message: the reader has to act on it. */
  reason?: string;
  /**
   * The build failure the *document* reported, when reading it was already the answer.
   *
   * Only web can reach this. Its dev server renders the page on the server, so a project that does
   * not compile never produces a page with a script tag in it — it produces an error page carrying
   * the whole failure, and there is no bundle URL left to fetch.
   */
  error?: BundleCheckError;
}

/**
 * The entry bundle URL this dev server would hand the app, for one platform.
 *
 * Two documents answer this and the platform decides which: native reads the manifest, web reads
 * the page. Both end in the same place — one URL, used byte for byte.
 */
function readEntryBundleUrlAsync(
  origin: string,
  platform: BundleCheckPlatform,
  signal: AbortSignal
): Promise<EntryBundleUrl> {
  return platform === 'web'
    ? readWebBundleUrlAsync(origin, signal)
    : readManifestBundleUrlAsync(origin, platform, signal);
}

/**
 * Read the entry bundle URL out of the page the web dev server serves.
 *
 * The web dev server has no manifest: `GET /` is the HTML a browser loads, and the dev server
 * appends the entry bundle to it as the last `<script src>` [observed —
 * `ManifestMiddleware.getSingleHtmlTemplateAsync` → `appendScriptsToHtml`]. The tag is written with
 * a raw `&` between the query parameters, but a page that ever escapes them still has to resolve to
 * the same URL, so the entities are decoded rather than assumed away.
 *
 * A regular expression over HTML, deliberately: the alternative is a parser dependency for one
 * attribute of one tag that this dev server writes itself, and a page with no `.bundle` script in
 * it is reported as undecidable rather than guessed at.
 */
async function readWebBundleUrlAsync(origin: string, signal: AbortSignal): Promise<EntryBundleUrl> {
  const pageUrl = `${origin}/`;
  const response = await fetch(pageUrl, { headers: { accept: 'text/html' }, signal });
  const html = await response.text();

  if (!response.ok) {
    // The page the web dev server serves for a project that does not compile, which carries the
    // whole failure as JSON [observed — `metroErrorInterface.ts` `getErrorOverlayHtmlAsync`, and
    // live on 2026-08-23: HTTP 500 with `<script id="_expo-static-error">`].
    const staticError = readStaticErrorPage(html);
    if (staticError) {
      return { url: null, error: staticError };
    }
    return {
      url: null,
      reason: `${pageUrl} answered ${response.status} ${response.statusText}, and the body is not an Expo error page, so nothing can be said about the web bundle`,
    };
  }

  const sources = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/gi)].map((match) =>
    decodeHtmlEntities(match[1]!)
  );
  const source = sources.find((src) => /\.bundle(?:[?#]|$)/.test(src));
  if (!source) {
    return {
      url: null,
      reason: `the page at ${pageUrl} names no .bundle script, so there is no web entry bundle to build — the web target may be served by something other than Metro`,
    };
  }

  try {
    return { url: new URL(source, pageUrl).toString() };
  } catch {
    return {
      url: null,
      reason: `the page at ${pageUrl} names an unusable bundle script: ${source}`,
    };
  }
}

/** The three entities an attribute value can carry that change what the URL means. */
function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

/**
 * The failure an Expo error page carries, or null when the page is not one.
 *
 * The web dev server embeds the whole LogBox record as JSON in a `<script>` of a known id, with
 * `<` escaped so the payload cannot close its own tag [observed — `metroErrorInterface.ts`]. The
 * fields are read defensively: this is another program's internal shape, and a page that has grown
 * a different one must read as "not an error page" rather than as a half-filled error.
 */
function readStaticErrorPage(html: string): BundleCheckError | null {
  const embedded = html.match(/<script id="_expo-static-error"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  if (!embedded) {
    return null;
  }

  let log: Record<string, any> | undefined;
  try {
    log = JSON.parse(embedded)?.logs?.[0];
  } catch {
    return null;
  }
  const content = readString(log?.message?.content);
  const codeFrame = log?.codeFrame;
  const frame = log?.stack?.[0];
  if (!content && !codeFrame) {
    return null;
  }

  // The message is already ANSI-stripped here and the code frame is not [observed — the CLI strips
  // one and not the other], so both go through the same stripper rather than one being trusted.
  const [firstLine, ...rest] = stripVTControlCharacters(content ?? '').split('\n');
  return {
    type: readErrorPageType(log),
    filename: readString(codeFrame?.fileName) ?? readString(frame?.file),
    lineNumber: readNumber(codeFrame?.location?.row) ?? readNumber(frame?.lineNumber),
    column: readNumber(codeFrame?.location?.column) ?? readNumber(frame?.column),
    message: firstLine?.trim() || 'the web dev server answered with an error page',
    snippet: readSnippet(rest) ?? stripSnippet(codeFrame?.content),
  };
}

/**
 * The Metro error class one web error page reports, derived from the record it carries.
 *
 * The native check reads `type` out of the bundler's own answer; the page has no such field, so
 * `--platform web` reported `type: null` for the same file that `--platform ios` reported
 * `TransformError` for, and a consumer that parsed one did not parse the other (F37). What makes
 * the derivation sound rather than a guess is *when the page exists at all*: the web dev server
 * renders it **in place of** the bundle, so a page is only ever produced by a failure that stopped
 * the build, and `level` says which kind of failure stopped it [observed — `@expo/log-box-utils`
 * `parseWebBuildErrors`, which builds `level: 'resolution'` from an `UnableToResolveError` and
 * `level: 'static'` from everything else, Metro's `TransformError` included].
 *
 * Two guards keep it honest:
 *
 * - **An explicit `type` wins**, so the day the page carries the class itself, this stops deriving
 *   anything. `'error'` is not read as one: `LogBoxLog` fills that in for a record that named no
 *   type [observed — `log-box/LogBoxLog.ts`, `data.type ?? 'error'`], so it is the absence of an
 *   answer wearing the shape of one.
 * - **A record with no level at all stays `null`**, the way an unrecognised page always has.
 *
 * The upstream ask that would retire this is recorded in llp/0010 §Upstream asks.
 */
function readErrorPageType(log: Record<string, any> | undefined): string | null {
  const declared = readString(log?.type);
  if (declared && declared !== 'error') {
    return declared;
  }
  switch (readString(log?.level)) {
    case 'resolution':
      return 'UnableToResolveError';
    case 'static':
    case 'syntax':
    case 'fatal':
    case 'error':
      return 'TransformError';
    default:
      return null;
  }
}

/**
 * Report a file the bundler named relative to the project, when it is inside it.
 *
 * Metro names the file relative to the project root already and the web error page names it
 * absolutely, so the same syntax error in the same file arrived as `src/app/index.tsx` on iOS and
 * `/Users/…/src/app/index.tsx` on web (F37). Both are now the first of those.
 */
function relativizeFilename(filename: string | null, projectRoot: string | null): string | null {
  if (filename == null || projectRoot == null) {
    return filename;
  }
  // Both sides through one separator, because Windows spells the project root with backslashes and
  // whether the dev server spells the file the same way is not something to depend on.
  const prefix = projectRoot.replace(/\\/g, '/').replace(/\/+$/, '') + '/';
  const normalized = filename.replace(/\\/g, '/');
  return normalized.startsWith(prefix) ? normalized.slice(prefix.length) : filename;
}

/**
 * Read the entry bundle URL out of the dev server's manifest.
 *
 * `Accept: application/json` on purpose: the same manifest is served as `multipart/mixed` to an
 * Expo Updates client that needs a detached signature, and a plain HTTP client has no reason to
 * parse multipart framing to reach a JSON object it can ask for directly.
 */
async function readManifestBundleUrlAsync(
  origin: string,
  platform: BundleCheckPlatform,
  signal: AbortSignal
): Promise<EntryBundleUrl> {
  const manifestUrl = `${origin}/`;
  const response = await fetch(manifestUrl, {
    headers: { 'expo-platform': platform, accept: 'application/json' },
    signal,
  });

  if (!response.ok) {
    return {
      url: null,
      reason: `${manifestUrl} answered ${response.status} ${response.statusText} for the ${platform} manifest, so the entry bundle URL is unknown`,
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    // The exception is a `SyntaxError` about byte 0 of the body, which says nothing a reader can
    // act on. What they need is what the dev server sent instead.
    const contentType = response.headers.get('content-type')?.split(';')[0]?.trim();
    return {
      url: null,
      reason: `${manifestUrl} answered ${contentType ?? 'something that is not JSON'} instead of the ${platform} manifest, so the entry bundle URL is unknown — whatever is on this port may not be an Expo dev server`,
    };
  }

  const launchAsset = (payload as { launchAsset?: { url?: unknown } } | null)?.launchAsset;
  if (typeof launchAsset?.url !== 'string' || !launchAsset.url) {
    return {
      url: null,
      reason: `the ${platform} manifest at ${manifestUrl} names no launchAsset.url, so there is no entry bundle to build`,
    };
  }

  // The dev server answers with a path-relative URL when the request carried a `Forwarded` header
  // [observed — `ManifestMiddleware.toPathRelativeUrl`], so it is resolved rather than trusted to
  // be absolute.
  try {
    return { url: new URL(launchAsset.url, manifestUrl).toString() };
  } catch {
    return {
      url: null,
      reason: `the ${platform} manifest names an unusable launchAsset.url: ${launchAsset.url}`,
    };
  }
}

/** Reshape Metro's failed-build body, or describe the answer when it is not one. */
async function readBundleErrorAsync(response: Response): Promise<BundleCheckError> {
  const text = await response.text().catch(() => '');

  let payload: Record<string, unknown> | null = null;
  try {
    const parsed = JSON.parse(text);
    payload = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    // Not JSON — handled below, by quoting what did arrive.
  }

  if (payload == null) {
    return {
      type: null,
      filename: null,
      lineNumber: null,
      column: null,
      message: `the bundler answered ${response.status} ${response.statusText}${
        text.trim() ? `: ${excerpt(text)}` : ''
      }`,
      snippet: null,
    };
  }

  // The message carries the error on its first line and a Babel code frame under it, with ANSI
  // colors: the worker farm is spawned with `FORCE_COLOR=1`, so the codes are always there.
  const message = stripVTControlCharacters(readString(payload.message) ?? '');
  const [firstLine, ...frame] = message.split('\n');

  return {
    type: readString(payload.type),
    filename: readString(payload.filename),
    lineNumber: readNumber(payload.lineNumber),
    column: readNumber(payload.column),
    message: firstLine?.trim() || `the bundler answered ${response.status} with no message`,
    snippet: readSnippet(frame) ?? stripSnippet(payload.snippet),
  };
}

/** The code frame that follows the first line of Metro's message, or null when there is none. */
function readSnippet(lines: string[]): string | null {
  const frame = lines.join('\n').replace(/^\n+|\s+$/g, '');
  return frame || null;
}

/** Metro also sends the frame on its own, for the failures whose message does not embed one. */
function stripSnippet(value: unknown): string | null {
  const snippet = readString(value);
  return snippet ? stripVTControlCharacters(snippet).replace(/\s+$/, '') : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Fit an answer that is not a bundler error on one line. */
function excerpt(body: string): string {
  const line = body.trim().split('\n')[0]!;
  return line.length > BODY_EXCERPT_LENGTH ? `${line.slice(0, BODY_EXCERPT_LENGTH)}…` : line;
}

/**
 * The `bundle` object of the `--json` payload.
 *
 * Always present with the same keys, so a parser reads one shape whether the check ran, was
 * declined with `--no-bundle-check`, or could not decide (llp/0006 §Output contract).
 */
export interface BundleCheckJson {
  /**
   * Whether the bundler answered about this project's entry bundle.
   *
   * Exactly `ok != null`, and that invariant is the point: `checked: true` with `ok: null` said
   * "this was checked and the answer is nothing", which is a contradiction a caller cannot act on
   * [observed — friction run 2, 2026-08-23, on `--platform web`]. A check that was declined, could
   * not find the entry bundle URL, or ran out of budget is `checked: false` with a {@link reason}.
   */
  checked: boolean;
  /**
   * True when it compiled, false when the bundler reported an error.
   *
   * Null when it was not decided: the check was declined, the dev server was never ready, the
   * budget expired, or the entry bundle URL could not be read. Null is never "broken".
   */
  ok: boolean | null;
  /** Platform the bundle was built for, or null when nothing was built. */
  platform: BundleCheckPlatform | null;
  /** Entry bundle URL that was fetched, resolved from the dev server's own manifest. */
  url: string | null;
  /** What the bundler reported. Present exactly when `ok` is false. */
  error: BundleCheckError | null;
  /** Why `ok` is null. */
  reason: string | null;
}

/** The reason a bundle object carries when nothing was built, per why nothing was. */
const BUNDLE_NOT_RUN_REASON = 'the entry bundle check was not run';
const BUNDLE_SKIPPED_REASON = `${BUNDLE_NOT_RUN_REASON} (--no-bundle-check)`;

/**
 * The `bundle` object, with the same keys whatever the check did or did not manage to do.
 *
 * Shared with `runtime:reload`, which runs the same check before it reloads anything, so the one
 * question "does this project's entry bundle compile" is reported in one shape wherever it is
 * asked (llp/0010 §Other gates, in brief).
 */
export function bundleToJson(
  bundle: BundleCheckResult | null,
  { skippedByFlag = false }: { skippedByFlag?: boolean } = {}
): BundleCheckJson {
  if (bundle == null) {
    return {
      checked: false,
      ok: null,
      platform: null,
      url: null,
      error: null,
      reason: skippedByFlag ? BUNDLE_SKIPPED_REASON : BUNDLE_NOT_RUN_REASON,
    };
  }
  const ok = bundle.outcome === 'ok' ? true : bundle.outcome === 'broken' ? false : null;
  return {
    // `checked` and `ok` move together: nothing but an answer from the bundler counts as a check.
    checked: ok != null,
    ok,
    platform: bundle.platform,
    url: bundle.url,
    error: bundle.error,
    reason:
      ok == null ? (bundle.reason ?? 'the bundler gave no answer about the entry bundle') : null,
  };
}
