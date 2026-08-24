// @ref llp/0010-agent-conventions.rfc.md §The second: `dev:wait`
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

/** What the bundler reported, reshaped into the fields worth acting on. */
export interface BundleCheckError {
  /** Metro's own class for the failure, e.g. `TransformError` or `UnableToResolveError`. */
  type: string | null;
  /** File the bundler stopped in, as Metro named it. Null when it named none. */
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
  { platform, timeoutMs }: CheckEntryBundleOptions
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

  const finish = (result: Omit<BundleCheckResult, 'platform' | 'waitedMs'>): BundleCheckResult => ({
    ...result,
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
    const head = await fetch(entry.url, { method: 'HEAD', signal: controller.signal });
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
async function readWebBundleUrlAsync(
  origin: string,
  signal: AbortSignal
): Promise<EntryBundleUrl> {
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
    return { url: null, reason: `the page at ${pageUrl} names an unusable bundle script: ${source}` };
  }
}

/** The three entities an attribute value can carry that change what the URL means. */
function decodeHtmlEntities(value: string): string {
  return value.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
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
  const embedded = html.match(
    /<script id="_expo-static-error"[^>]*>([\s\S]*?)<\/script>/
  )?.[1];
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
    // The page reports no Metro error class, and inventing `TransformError` would claim a fact the
    // dev server did not state.
    type: null,
    filename: readString(codeFrame?.fileName) ?? readString(frame?.file),
    lineNumber: readNumber(codeFrame?.location?.row) ?? readNumber(frame?.lineNumber),
    column: readNumber(codeFrame?.location?.column) ?? readNumber(frame?.column),
    message: firstLine?.trim() || 'the web dev server answered with an error page',
    snippet: readSnippet(rest) ?? stripSnippet(codeFrame?.content),
  };
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
