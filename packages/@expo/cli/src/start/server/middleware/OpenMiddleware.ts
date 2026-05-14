import { disableResponseCache, ExpoMiddleware } from './ExpoMiddleware';
import { parsePlatformHeader } from './resolvePlatform';
import type { ServerRequest, ServerResponse } from './server.types';
import { isLocalSocket } from '../../../utils/net';

export const OpenEndpoint = '/_expo/open';

/**
 * Resolved runtime returned by the server. Omitted when the URL is a disambiguation page (the
 * actual runtime — Expo Go vs. dev build — isn't decided until the device picks). Matches what
 * the CLI does for `i`/`a` when the project supports both Expo Go and a development build.
 */
export type OpenRuntime = 'expo' | 'custom' | 'web';

/**
 * Runtime that a caller can request.
 * - `default` mirrors the CLI's `i`/`a` resolution.
 * - `expo` / `custom` force a direct deep link, bypassing disambiguation.
 * - `unknown` forces the disambiguation/interstitial page even when the CLI would resolve
 *   directly. Useful when the caller wants the device (rather than the dev server) to decide.
 */
export type OpenRequestedRuntime = 'expo' | 'custom' | 'unknown' | 'default';

/** Subset of {@link OpenRuntime} that represents native deep-link choices (not how to deliver them). */
export type OpenNativeRuntime = 'expo' | 'custom';

/** Platform supported by the open endpoint. */
export type OpenPlatform = 'ios' | 'android' | 'web';

/** Whether the dev server's host machine can launch the project on a given platform. */
export interface OpenHostSupportEntry {
  /** `true` when the host machine is expected to be able to open the platform locally. */
  canOpen: boolean;
  /** Human-readable explanation when `canOpen` is `false`. */
  reason?: string;
}

/** Per-platform open info — present whether the caller asked for one platform or for discovery. */
export interface OpenPlatformInfo {
  /**
   * Concrete runtime that the URL targets. `undefined` when the URL is a disambiguation page —
   * the device decides between Expo Go and the dev build after the user picks.
   */
  runtime?: OpenRuntime;
  /** Deep link (native), disambiguation HTML page (when `runtime` is omitted), or dev server URL (web). `null` when no URL scheme is configured for `runtime: 'custom'`. */
  url: string | null;
  /**
   * Native application identifier (iOS bundle identifier / Android package name) used to detect
   * whether the project is already installed on a target device. `null` when the platform has no
   * concept of an app ID (web), when the project's config is missing the identifier, or when
   * resolution failed. Useful for distributed preview systems that need to confirm a build is
   * present before opening a deep link.
   */
  appId: string | null;
}

/** Project-level metadata returned on every GET. */
interface OpenProjectMeta {
  /** URL scheme used for development build deep links (e.g. `myapp`). `null` when none is configured. */
  scheme: string | null;
  /**
   * Native runtimes the project can target. `['expo']` for Expo Go only, `['custom']` for a dev
   * client only, `['expo', 'custom']` when both are configured — in that case the caller should
   * either pick one explicitly or rely on `runtime: 'default'` (which mirrors the CLI's
   * disambiguation behavior).
   */
  availableRuntimes: OpenNativeRuntime[];
}

/** GET `/_expo/open?platform=…` — focused per-platform response. */
export interface OpenSinglePlatformResult extends OpenProjectMeta, OpenPlatformInfo {}

/** GET `/_expo/open` — discovery response with all platforms. */
export interface OpenDiscoveryResult extends OpenProjectMeta {
  platforms: Record<OpenPlatform, OpenPlatformInfo>;
}

export type OpenInfoResult = OpenSinglePlatformResult | OpenDiscoveryResult;

/** Result of a POST to `/_expo/open`. */
export interface OpenActionResult {
  platform: OpenPlatform;
  runtime: OpenRuntime;
  /** Deep link that was opened on the local device. */
  url: string;
}

export interface OpenMiddlewareOptions {
  /** Compute the dry-run information for the requested platform + runtime. */
  getInfo: (props: {
    platform: OpenPlatform | null;
    runtime: OpenRequestedRuntime;
  }) => Promise<OpenInfoResult>;
  /** Open the project locally on the requested platform — equivalent to pressing `i` / `a` in the terminal UI. */
  open: (props: { platform: OpenPlatform }) => Promise<OpenActionResult>;
  /** Whether the host can launch a given platform. */
  getHostSupport: (platform: OpenPlatform) => OpenHostSupportEntry;
}

export class OpenMiddleware extends ExpoMiddleware {
  constructor(
    projectRoot: string,
    protected options: OpenMiddlewareOptions
  ) {
    super(projectRoot, [OpenEndpoint]);
  }

  async handleRequestAsync(req: ServerRequest, res: ServerResponse): Promise<void> {
    disableResponseCache(res);
    res.setHeader('Content-Type', 'application/json');

    const method = (req.method ?? 'GET').toUpperCase();
    const searchParams = new URL(req.url ?? '', 'http://localhost').searchParams;
    const platformParam = parsePlatformHeader(req);
    const platform = normalizePlatform(platformParam);
    const runtimeParam = searchParams.get('runtime') ?? undefined;
    const normalizedRuntime = runtimeParam ? normalizeRequestedRuntime(runtimeParam) : 'default';

    if (platformParam && !platform) {
      sendError(res, 400, {
        code: 'INVALID_PLATFORM',
        error: `Unsupported "platform" value "${platformParam}". Must be "ios", "android", or "web".`,
      });
      return;
    }

    if (runtimeParam && !normalizedRuntime) {
      sendError(res, 400, {
        code: 'INVALID_RUNTIME',
        error: `Unsupported "runtime" value "${runtimeParam}". Must be "default", "expo", "custom", or "unknown".`,
      });
      return;
    }
    const runtime: OpenRequestedRuntime = normalizedRuntime ?? 'default';

    if (method === 'POST') {
      const sameDeviceError = assertSameDevice(req);
      if (sameDeviceError) {
        sendError(res, 403, sameDeviceError);
        return;
      }

      const sameOriginError = assertSameOrigin(req);
      if (sameOriginError) {
        sendError(res, 403, sameOriginError);
        return;
      }

      if (!platform) {
        sendError(res, 400, {
          code: 'MISSING_PLATFORM',
          error: `POST /_expo/open requires a platform. Pass it as the "platform" query param or "expo-platform" header. Must be "ios", "android", or "web".`,
        });
        return;
      }

      const support = this.options.getHostSupport(platform);
      if (!support.canOpen) {
        sendError(res, 501, {
          code: 'HOST_CANNOT_OPEN_PLATFORM',
          platform,
          error: `Cannot open the project on ${platform} from this dev server host.`,
          details:
            (support.reason ? support.reason + ' ' : '') +
            `Use GET /_expo/open?platform=${platform} to retrieve the deep link, then launch it from a host that supports ${platform} or hand it to a remote preview service.`,
        });
        return;
      }

      try {
        const result = await this.options.open({ platform });
        res.statusCode = 200;
        res.end(JSON.stringify(result));
      } catch (error: any) {
        sendError(res, 500, {
          code: typeof error?.code === 'string' ? error.code : 'OPEN_FAILED',
          platform,
          error: `Failed to open the project on ${platform}.`,
          details:
            (typeof error?.message === 'string' ? error.message : String(error)) +
            ` Check the dev server logs for more detail, or use GET /_expo/open?platform=${platform} to launch the deep link from another environment.`,
        });
      }
      return;
    }

    if (method !== 'GET' && method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD, POST');
      sendError(res, 405, {
        code: 'METHOD_NOT_ALLOWED',
        error: `Method "${method}" not allowed. Use GET to inspect, POST to open.`,
      });
      return;
    }

    const info = await this.options.getInfo({ platform, runtime });
    res.statusCode = 200;
    res.end(JSON.stringify(info));
  }
}

function normalizePlatform(p: string | null): OpenPlatform | null {
  return p === 'ios' || p === 'android' || p === 'web' ? p : null;
}

function normalizeRequestedRuntime(r: string | undefined): OpenRequestedRuntime | null {
  return r === 'default' || r === 'expo' || r === 'custom' || r === 'unknown' ? r : null;
}

interface ErrorBody {
  code: string;
  error: string;
  platform?: OpenPlatform;
  details?: string;
}

function sendError(res: ServerResponse, statusCode: number, body: ErrorBody) {
  res.statusCode = statusCode;
  res.end(JSON.stringify(body));
}

function assertSameDevice(req: ServerRequest): ErrorBody | null {
  const socket = (req as { socket?: ServerRequest['socket'] }).socket;
  if (socket && isLocalSocket(socket)) {
    return null;
  }
  return {
    code: 'REMOTE_DEVICE_FORBIDDEN',
    error: 'POST /_expo/open is restricted to same-device requests.',
    details:
      `The dev server only opens the project for clients connected over the loopback interface ` +
      `so a device on the LAN (or a tunnel client) can't launch the app on the developer's machine. ` +
      `Issue the POST from the dev server's host, or use GET /_expo/open to retrieve the deep link and open it from the remote device.`,
  };
}

function assertSameOrigin(req: ServerRequest): ErrorBody | null {
  const headers = req.headers ?? {};
  const origin = firstHeader(headers.origin);
  if (!origin) {
    return null;
  }
  const host = firstHeader(headers.host);
  let originHost: string | null = null;
  try {
    originHost = new URL(origin).host;
  } catch {
    // Malformed Origin — treat as untrusted.
  }
  if (!host || !originHost || originHost !== host) {
    return {
      code: 'CROSS_ORIGIN_FORBIDDEN',
      error: 'POST /_expo/open is restricted to same-origin requests.',
      details: `Request origin "${origin}" does not match the dev server host "${host ?? 'unknown'}". This protects the dev server from cross-origin scripts that might try to launch the app without the developer's consent. Issue POST requests from the dev server's origin (or from a non-browser client), or use GET /_expo/open to retrieve the deep link and open it yourself.`,
    };
  }
  return null;
}

function firstHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value ?? undefined;
}
