import type {
  OpenActionResult,
  OpenInfoResult,
  OpenMiddlewareOptions,
  OpenNativeRuntime,
  OpenPlatform,
  OpenPlatformInfo,
  OpenRequestedRuntime,
} from './OpenMiddleware';
import type { UrlCreator } from '../UrlCreator';

interface InfoHandlerDeps {
  /** Stable UrlCreator instance — its `defaults` mutate when `toggleRuntimeMode` runs, so the same instance keeps producing fresh URLs and reflects the current scheme. */
  urlCreator: UrlCreator;
  /**
   * Read live values every call. The dev server's runtime mode can flip mid-run via the `s` key
   * in the terminal, and `expo-dev-client` can be installed while the server is running — both
   * change `isDevClient` and `isRedirectPageEnabled`, and the endpoint should reflect the
   * current state on every request.
   */
  getIsDevClient: () => boolean;
  /** Live mirror of `BundlerDevServer.isRedirectPageEnabled()`. */
  getIsRedirectPageEnabled: () => boolean;
  /**
   * Resolve the native application identifier for a platform (iOS bundle id / Android package
   * name). Implementations should return `null` instead of throwing when the project has no
   * configured identifier; the endpoint surfaces `null` so distributed preview systems can detect
   * that the build can't be matched by app id and either bail out or prompt the user.
   */
  getAppId: (platform: OpenPlatform) => Promise<string | null>;
}

/**
 * Build the GET handler for `/_expo/open`. Resolves dry-run info for a single platform, or for
 * every platform in discovery mode. Extracted so it can be exercised with a real
 * {@link UrlCreator} in tests (covers tunnel routing in particular).
 */
export function createInfoHandler(deps: InfoHandlerDeps): OpenMiddlewareOptions['getInfo'] {
  return ({ platform, runtime }) => resolveOpenInfo({ platform, runtime }, deps);
}

export async function resolveOpenInfo(
  { platform, runtime }: { platform: OpenPlatform | null; runtime: OpenRequestedRuntime },
  deps: InfoHandlerDeps
): Promise<OpenInfoResult> {
  // Snapshot the live state once per request so the response is internally consistent even if a
  // toggle happens between sub-resolutions.
  const scheme = deps.urlCreator.getScheme();
  const isDevClient = deps.getIsDevClient();
  const isRedirectPageEnabled = deps.getIsRedirectPageEnabled();
  const availableRuntimes: OpenNativeRuntime[] = isDevClient
    ? ['custom']
    : isRedirectPageEnabled
      ? ['expo', 'custom']
      : ['expo'];

  if (platform) {
    return {
      scheme,
      availableRuntimes,
      ...(await resolvePlatformInfo(platform, runtime, deps, {
        isDevClient,
        isRedirectPageEnabled,
      })),
    };
  }

  const [ios, android, web] = await Promise.all([
    resolvePlatformInfo('ios', runtime, deps, { isDevClient, isRedirectPageEnabled }),
    resolvePlatformInfo('android', runtime, deps, { isDevClient, isRedirectPageEnabled }),
    resolvePlatformInfo('web', runtime, deps, { isDevClient, isRedirectPageEnabled }),
  ]);
  return { scheme, availableRuntimes, platforms: { ios, android, web } };
}

async function resolvePlatformInfo(
  platform: OpenPlatform,
  runtime: OpenRequestedRuntime,
  deps: InfoHandlerDeps,
  state: { isDevClient: boolean; isRedirectPageEnabled: boolean }
): Promise<OpenPlatformInfo> {
  const { urlCreator, getAppId } = deps;
  const { isDevClient, isRedirectPageEnabled } = state;
  const appId = await getAppId(platform);

  if (platform === 'web') {
    // constructUrl inherits the tunnel host from `defaults.hostType` when --tunnel is active,
    // so this returns the ngrok URL instead of localhost in that case.
    return { runtime: 'web', url: urlCreator.constructUrl({ scheme: 'http' }), appId };
  }

  // Caller explicitly wants the disambiguation page — useful when they want the device (not the
  // dev server) to pick between Expo Go and the dev build. No `runtime` field on the response
  // since the actual runtime depends on the device's choice.
  if (runtime === 'unknown') {
    return { url: urlCreator.constructLoadingUrl({}, platform), appId };
  }

  // `runtime: 'default'` mirrors what pressing `i` / `a` does in the terminal:
  //   --dev-client server  → open the dev client directly.
  //   project has both     → hand off to the disambiguation interstitial so the
  //                          device resolves between Expo Go and the dev build.
  //   else                 → open Expo Go directly.
  if (runtime === 'default') {
    if (isDevClient) {
      return { runtime: 'custom', url: urlCreator.constructDevClientUrl(), appId };
    }
    if (isRedirectPageEnabled) {
      return { url: urlCreator.constructLoadingUrl({}, platform), appId };
    }
    return { runtime: 'expo', url: urlCreator.constructUrl({ scheme: 'exp' }), appId };
  }

  return {
    runtime,
    url:
      runtime === 'custom'
        ? urlCreator.constructDevClientUrl()
        : urlCreator.constructUrl({ scheme: 'exp' }),
    appId,
  };
}

interface OpenHandlerDeps {
  /** Live `BundlerDevServer.isDevClient` — `s` in the terminal can flip this between dispatch and response. */
  getIsDevClient: () => boolean;
  /** Same shape as `BundlerDevServer.openPlatformAsync`. */
  openPlatformAsync: (
    launchTarget: 'simulator' | 'emulator' | 'desktop',
    resolver?: { shouldPrompt?: boolean }
  ) => Promise<{ url: string | null }>;
}

/** Build the POST handler for `/_expo/open` — dispatches to the dev server's platform launcher. */
export function createOpen(deps: OpenHandlerDeps): OpenMiddlewareOptions['open'] {
  return async ({ platform }): Promise<OpenActionResult> => {
    if (platform === 'web') {
      const result = await deps.openPlatformAsync('desktop');
      return { platform, runtime: 'web', url: result.url ?? '' };
    }
    const launchTarget = platform === 'ios' ? 'simulator' : 'emulator';
    const result = await deps.openPlatformAsync(launchTarget, { shouldPrompt: false });
    return {
      platform,
      runtime: deps.getIsDevClient() ? 'custom' : 'expo',
      url: result.url ?? '',
    };
  };
}
