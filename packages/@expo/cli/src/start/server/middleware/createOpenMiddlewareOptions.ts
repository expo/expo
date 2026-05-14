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
  urlCreator: UrlCreator;
  scheme: string | null;
  isDevClient: boolean;
  /** Result of `BundlerDevServer.isRedirectPageEnabled()` — true when the project supports both Expo Go and a dev build. */
  isRedirectPageEnabled: boolean;
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
  const { scheme, isDevClient, isRedirectPageEnabled } = deps;
  const availableRuntimes: OpenNativeRuntime[] = isDevClient
    ? ['custom']
    : isRedirectPageEnabled
      ? ['expo', 'custom']
      : ['expo'];

  if (platform) {
    return {
      scheme,
      availableRuntimes,
      ...(await resolvePlatformInfo(platform, runtime, deps)),
    };
  }

  const [ios, android, web] = await Promise.all([
    resolvePlatformInfo('ios', runtime, deps),
    resolvePlatformInfo('android', runtime, deps),
    resolvePlatformInfo('web', runtime, deps),
  ]);
  return { scheme, availableRuntimes, platforms: { ios, android, web } };
}

async function resolvePlatformInfo(
  platform: OpenPlatform,
  runtime: OpenRequestedRuntime,
  deps: ResolveInfoDeps
): Promise<OpenPlatformInfo> {
  const { urlCreator, isDevClient, isRedirectPageEnabled, getAppId } = deps;
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
  const { openPlatformAsync, getHostSupport, isDevClient } = deps;
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
      return { platform, runtime: isDevClient ? 'custom' : 'expo', url: result.url ?? '' };
    },
  };
}
