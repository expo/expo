// @ref llp/0005-runtime-loop-tools.rfc.md
// Deep-link primitives: resolve a project's URL scheme, turn a route into a launchable URL, and
// open that URL on a booted device.
//
// The scheme is read statically from the project config files. Evaluating `app.config.js` would
// run project code inside the CLI, which the process boundary of llp/0001 §Constraints item 5
// exists to avoid; callers pass `--scheme` explicitly in that case.
import fs from 'fs';
import path from 'path';

import { CommandError } from '../utils/errors';
import { spawnCaptureAsync } from '../utils/spawnCapture';

/**
 * The path an Expo Go deep link must carry to reach the **root** route of a loaded app.
 *
 * Neither `exp://<host>` nor `exp://<host>/--/` reaches it, and the reason is in the router, not
 * in Expo Go [observed — `expo-router/src/link/linking.ts`, 2026-08-23]. `subscribe`'s Expo Go
 * branch runs every incoming URL through `parseExpoGoUrlFromListener`, which replaces a link whose
 * path is empty or `/` with `getRootURL() + queryString` — and `getRootURL()` in Expo Go is
 * `parsePathFromExpoGoLink(Linking.createURL('/'))`, which is the **empty string**. The listener
 * then ends in `if (href) listener(href)`, so the root link is dropped before the router ever sees
 * it. Every other route survives, which is why only `/` was unreachable [observed — friction run
 * 3, F33].
 *
 * A bare `?` is the smallest thing that gets past that guard: the query string is kept, so `href`
 * is `"?"`, which is truthy, and a path of `""` with an empty query resolves to the index route.
 * Verified live [observed — 2026-08-23, SDK 57 app in Expo Go on an iOS simulator: from `/notes`,
 * `exp://127.0.0.1:8170/--/` left the app on `/notes` and `exp://127.0.0.1:8170/--/?` landed it on
 * the root route].
 *
 * A development build needs none of this: its listener passes the URL through whatever the path
 * is, so `<scheme>://` already means the index route.
 */
const EXPO_GO_ROOT_PATH = '/--/?';

/** Static config files we can read without evaluating JavaScript. */
const STATIC_CONFIG_FILES = ['app.json', 'app.config.json'];

/** Config files that require evaluating JavaScript, which we do not do. */
const DYNAMIC_CONFIG_FILES = ['app.config.ts', 'app.config.js', 'app.config.mjs', 'app.config.cjs'];

export interface ProjectSchemeConfig {
  /** First `expo.scheme` entry found in a static config file, if any. */
  scheme: string | null;
  /** `expo.slug`, falling back to `package.json` `name`. Used for `exp+<slug>://`. */
  slug: string | null;
  /** Name of the static config file the values came from, if any. */
  configFile: string | null;
  /** Name of a dynamic config file present in the project, if any. */
  dynamicConfigFile: string | null;
}

/**
 * Read the URL scheme and slug from the project's static config files.
 *
 * Reads `app.json` then `app.config.json`, accepting either an `expo` key or a bare config
 * object. Does not evaluate `app.config.js` / `app.config.ts`; when one is present its name is
 * reported so the caller can explain the gap.
 */
export function readProjectSchemeConfig(projectRoot: string): ProjectSchemeConfig {
  const result: ProjectSchemeConfig = {
    scheme: null,
    slug: null,
    configFile: null,
    dynamicConfigFile: null,
  };

  for (const fileName of STATIC_CONFIG_FILES) {
    const config = readJsonFile(path.join(projectRoot, fileName));
    if (config == null) {
      continue;
    }
    const expoConfig = (isRecord(config.expo) ? config.expo : config) as Record<string, unknown>;
    const scheme = firstScheme(expoConfig.scheme);
    const slug = nonEmptyString(expoConfig.slug);
    if (scheme != null || slug != null) {
      result.scheme = scheme;
      result.slug = slug;
      result.configFile = fileName;
      break;
    }
  }

  for (const fileName of DYNAMIC_CONFIG_FILES) {
    if (fs.existsSync(path.join(projectRoot, fileName))) {
      result.dynamicConfigFile = fileName;
      break;
    }
  }

  if (result.slug == null) {
    const packageJson = readJsonFile(path.join(projectRoot, 'package.json'));
    // `expo.slug` defaults to the package name when it is not set in the config.
    result.slug = packageJson != null ? nonEmptyString(packageJson.name) : null;
  }

  return result;
}

export interface ResolveDeepLinkUrlParams {
  /** Route path (`/profile/42`) or a full URL (`myapp://profile/42`). */
  route: string;
  /** Scheme supplied with `--scheme`, which wins over anything detected. */
  schemeOverride?: string;
  config: ProjectSchemeConfig;
  /** True when the target app is Expo Go, which uses the `exp://` URL shape. */
  isExpoGo: boolean;
  /** Dev server URL, required for the Expo Go URL shape. */
  devServerUrl?: string | null;
  /**
   * The host a device **off this machine** reaches the dev server at, which wins over the host of
   * {@link devServerUrl}.
   *
   * Set for a tunnelled run, and only then. `devServerUrl` is where the dev server listens on this
   * machine — `http://127.0.0.1:8081` — which is the right address for every command that talks to
   * it and the wrong one for the only thing this file produces: a link a *device* opens. A phone
   * cannot use it, and neither can a cloud simulator, which is what made an entire dogfood session
   * unable to load the app it had a tunnel for [observed — 2026-08-24].
   *
   * @see src/dev/advertisedUrl.ts, which reads the host out of what the dev server printed.
   */
  reachHost?: string | null;
}

export type ResolveDeepLinkUrlResult =
  | { ok: true; url: string; resolution: string }
  | {
      ok: false;
      error: string;
      /**
       * The command to put on the `Try:` line, decided here because it depends on *which* of the
       * three ways this can fail happened.
       *
       * One `Try:` for all three was `npx exagent navigate <route> --scheme <your-app-scheme>` —
       * two placeholders, so an agent could not run the last line of the failure at all
       * [observed — friction run 5]. A missing dev server is answered by starting one; a project
       * with no resolvable scheme is the one case where a person genuinely has to supply a value,
       * and its `Try:` is the command that prints what the project does declare rather than a
       * line with a hole in it.
       */
      suggestedCommand: string;
    };

/**
 * Build the URL to open for a route.
 *
 * Precedence: a full URL passes through unchanged, then an explicit scheme, then the Expo Go
 * shape, then the config scheme, then `exp+<slug>://`.
 */
export function resolveDeepLinkUrl({
  route,
  schemeOverride,
  config,
  isExpoGo,
  devServerUrl,
  reachHost,
}: ResolveDeepLinkUrlParams): ResolveDeepLinkUrlResult {
  const trimmedRoute = route.trim();
  if (trimmedRoute.length === 0) {
    return {
      ok: false,
      error: [
        'The route is empty.',
        'Why: there is nothing to navigate to.',
        'How: pass a route path such as "/profile/42", or a full URL such as "myapp://profile/42".',
      ].join('\n'),
      suggestedCommand: 'npx exagent navigate /',
    };
  }

  if (isFullUrl(trimmedRoute)) {
    return {
      ok: true,
      url: trimmedRoute,
      resolution: 'the route was already a full URL, so it was used unchanged',
    };
  }

  const routePath = stripLeadingSlashes(trimmedRoute);

  const overrideScheme = nonEmptyString(schemeOverride);
  if (overrideScheme != null) {
    return {
      ok: true,
      url: `${stripSchemeSuffix(overrideScheme)}://${routePath}`,
      resolution: 'used the --scheme flag',
    };
  }

  if (isExpoGo) {
    // The tunnel host first: it is the one address every device can use, and the only one a cloud
    // simulator can.
    const tunnelHost = nonEmptyString(reachHost);
    const host = tunnelHost ?? (devServerUrl != null ? hostFromUrl(devServerUrl) : null);
    if (host == null) {
      return {
        ok: false,
        error: [
          'Cannot build an Expo Go URL because the dev server URL is unknown.',
          'Why: Expo Go deep links have the shape exp://<host>/--/<route>, so they need the running dev server host.',
          'How: start the dev server with `npx exagent dev --detach` and run this command again, or pass --scheme to target a development build instead.',
        ].join('\n'),
        // The How: and the Try: named different commands here, which is a failure telling a reader
        // two things [observed — friction run 5]. Both are the one action that fixes this.
        suggestedCommand: 'npx exagent dev --detach',
      };
    }
    const where = tunnelHost
      ? `tunnel host ${host}, which is the one address a device off this machine can reach`
      : `dev server host ${host}`;
    if (routePath.length === 0) {
      return {
        ok: true,
        url: `exp://${host}${EXPO_GO_ROOT_PATH}`,
        resolution: `target app is Expo Go and the route is the root route, so the exp:// shape was used with a query marker that survives the Expo Go link handler, with ${where}`,
      };
    }
    return {
      ok: true,
      url: `exp://${host}/--/${routePath}`,
      resolution: `target app is Expo Go, so the exp:// shape was used with ${where}`,
    };
  }

  if (config.scheme != null) {
    return {
      ok: true,
      url: `${config.scheme}://${routePath}`,
      resolution: `read the "scheme" field from ${config.configFile}`,
    };
  }

  if (config.slug != null) {
    return {
      ok: true,
      url: `exp+${config.slug}://${routePath}`,
      resolution: `no "scheme" field was found, so the development build default exp+<slug>:// was used with slug "${config.slug}"`,
    };
  }

  const why =
    config.dynamicConfigFile != null
      ? `Why: this project uses ${config.dynamicConfigFile}, and this command reads the config statically instead of evaluating JavaScript.`
      : 'Why: no "scheme" or "slug" field was found in app.json or app.config.json, and package.json has no "name" field.';
  return {
    ok: false,
    error: [
      'Cannot resolve a URL scheme for this project.',
      why,
      'How: pass --scheme explicitly (for example --scheme myapp), or add a "scheme" field to app.json and rebuild the app.',
    ].join('\n'),
    // The one case where a person has to supply a value this CLI cannot know. The `Try:` is
    // therefore the command that *prints what the project declares* rather than a line with a
    // hole in it: `--scheme <your-app-scheme>` is not something an agent can run.
    suggestedCommand: 'npx exagent config:effective --json',
  };
}

export interface OpenUrlCommand {
  bin: string;
  args: string[];
  /** Human-readable form of the command, for the command output. */
  display: string;
}

export interface BuildOpenUrlCommandParams {
  platform: 'android' | 'ios';
  deviceId: string;
  url: string;
  /** Android only: scopes the intent to one package to skip the chooser dialog. */
  appId?: string;
}

/**
 * Build the device command that opens a URL.
 *
 * iOS uses `xcrun simctl openurl`. Android uses an ACTION_VIEW intent through `adb shell am
 * start`. The Android URL is quoted for the on-device shell, because `adb shell` re-parses its
 * arguments there.
 */
export function buildOpenUrlCommand({
  platform,
  deviceId,
  url,
  appId,
}: BuildOpenUrlCommandParams): OpenUrlCommand {
  const command: OpenUrlCommand =
    platform === 'ios'
      ? { bin: 'xcrun', args: ['simctl', 'openurl', deviceId, url], display: '' }
      : {
          bin: 'adb',
          args: [
            '-s',
            deviceId,
            'shell',
            'am',
            'start',
            '-a',
            'android.intent.action.VIEW',
            '-c',
            'android.intent.category.BROWSABLE',
            '-d',
            quoteForDeviceShell(url),
            ...(appId != null && appId.length > 0 ? [appId] : []),
          ],
          display: '',
        };
  command.display = [command.bin, ...command.args].join(' ');
  return command;
}

export interface OpenUrlResult {
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

/**
 * Open a URL on a booted device or simulator.
 *
 * Never throws for a non-zero exit code; the caller reports the device output. A device tool that
 * is not installed is a `CommandError`, because there is nothing the output can say about it.
 */
export async function openUrlOnDeviceAsync(
  params: BuildOpenUrlCommandParams
): Promise<OpenUrlResult> {
  const { bin, args, display } = buildOpenUrlCommand(params);
  const { stdout, stderr, exitCode, spawnError } = await spawnCaptureAsync(bin, args);

  if (spawnError) {
    throw new CommandError(
      'DEVICE_TOOL_MISSING',
      [
        `Could not run "${bin}", so the deep link was not opened on the device.`,
        `Why: ${spawnError.message}`,
        params.platform === 'ios'
          ? `How: install Xcode and its command line tools, which provide "xcrun simctl", then run this command again.`
          : `How: install the Android SDK platform tools, which provide "adb", and make sure they are on PATH, then run this command again.`,
      ].join('\n')
    );
  }

  return { command: display, stdout, stderr, exitCode };
}

/** Quote a value so the shell that `adb shell` starts on the device keeps it as one word. */
export function quoteForDeviceShell(value: string): string {
  return `'${value.split("'").join(`'\\''`)}'`;
}

/**
 * Whether the route is already a full URL, e.g. `myapp://profile/42`.
 *
 * Exported because it decides more than the URL shape: a full URL names an app of the caller's
 * choosing, so this project's route table has nothing to say about it (`./routeCheck`).
 */
export function isFullUrlRoute(value: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value.trim());
}

function isFullUrl(value: string): boolean {
  return isFullUrlRoute(value);
}

function stripLeadingSlashes(value: string): string {
  return value.replace(/^\/+/, '');
}

function stripSchemeSuffix(value: string): string {
  return value.replace(/:\/*$/, '');
}

function hostFromUrl(value: string): string | null {
  try {
    const host = new URL(value).host;
    return host.length > 0 ? host : null;
  } catch {
    return null;
  }
}

function readJsonFile(filePath: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function firstScheme(value: unknown): string | null {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const scheme = nonEmptyString(entry);
      if (scheme != null) {
        return scheme;
      }
    }
    return null;
  }
  return nonEmptyString(value);
}

function nonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
