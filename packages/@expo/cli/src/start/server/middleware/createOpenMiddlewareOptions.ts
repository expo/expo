import type {
  OpenHostSupportEntry,
  OpenInfoResult,
  OpenMiddlewareOptions,
  OpenNativeRuntime,
  OpenPlatform,
  OpenPlatformInfo,
  OpenRequestedRuntime,
} from './OpenMiddleware';
import type { UrlCreator } from '../UrlCreator';

interface ResolveInfoDeps {
  /** Stable UrlCreator instance — its `defaults` mutate when `toggleRuntimeMode` runs, so the same instance keeps producing fresh URLs. */
  urlCreator: UrlCreator;
  /**
   * Read live values every call. The dev server's runtime mode can flip mid-run via the `s` key
   * in the terminal, and `expo-dev-client` can be installed while the server is running — both
   * change `isDevClient`, `isRedirectPageEnabled`, and `scheme`, and the endpoint should reflect
   * the current state on every request.
   */
  getScheme: () => string | null;
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
 * Pure resolution of the GET response. Extracted from `MetroBundlerDevServer` so it can be
 * exercised with a real {@link UrlCreator} in tests (covers tunnel routing in particular).
 */
export async function resolveOpenInfo(
  { platform, runtime }: { platform: OpenPlatform | null; runtime: OpenRequestedRuntime },
  deps: ResolveInfoDeps
): Promise<OpenInfoResult> {
  // Snapshot the live state once per request so the response is internally consistent even if a
  // toggle happens between sub-resolutions.
  const scheme = deps.getScheme();
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
      ...(await resolvePlatformInfo(platform, runtime, deps, { isDevClient, isRedirectPageEnabled })),
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
  deps: ResolveInfoDeps,
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
      // No `runtime` here — the URL is the disambiguation page and the actual runtime depends on
      // the device's choice. The field is intentionally omitted so JSON.stringify drops it.
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

export interface CreateOpenMiddlewareOptionsDeps extends ResolveInfoDeps {
  /** Whether the host can launch a given platform — used by POST to short-circuit with a 501. */
  getHostSupport: (platform: OpenPlatform) => OpenHostSupportEntry;
  /** Same shape as `BundlerDevServer.openPlatformAsync`. */
  openPlatformAsync: (
    launchTarget: 'simulator' | 'emulator' | 'desktop',
    resolver?: { shouldPrompt?: boolean }
  ) => Promise<{ url: string | null }>;
}

/** Build the {@link OpenMiddlewareOptions} that wire the dev server into the `/_expo/open` middleware. */
export function createOpenMiddlewareOptions(
  deps: CreateOpenMiddlewareOptionsDeps
): OpenMiddlewareOptions {
  const { openPlatformAsync, getHostSupport, getIsDevClient } = deps;
  return {
    getHostSupport,
    getInfo: (params) => resolveOpenInfo(params, deps),
    open: async ({ platform }) => {
      if (platform === 'web') {
        const result = await openPlatformAsync('desktop');
        return { platform, runtime: 'web', url: result.url ?? '' };
      }
      const launchTarget = platform === 'ios' ? 'simulator' : 'emulator';
      const result = await openPlatformAsync(launchTarget, { shouldPrompt: false });
      // Read runtime mode live — `s` in the terminal can flip this between dispatch and response.
      return { platform, runtime: getIsDevClient() ? 'custom' : 'expo', url: result.url ?? '' };
    },
  };
}
