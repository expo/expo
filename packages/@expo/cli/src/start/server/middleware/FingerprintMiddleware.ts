import type {
  FingerprintPlatform,
  MismatchAdvice,
  ServerFingerprint,
} from '../metro/fingerprintService';
import { disableResponseCache, ExpoMiddleware } from './ExpoMiddleware';
import { parsePlatformHeader } from './resolvePlatform';
import type { ServerRequest, ServerResponse } from './server.types';

export const FingerprintEndpoint = '/_expo/fingerprint';

/** GET `/_expo/fingerprint?platform=…` response. */
export interface FingerprintResponse {
  platform: FingerprintPlatform;
  /** Current project fingerprint hash, comparable to the hash embedded in installed apps. */
  hash: string;
  /** Version of the project's `@expo/fingerprint` package, for diagnostics. */
  fingerprintVersion: string | null;
  /**
   * Remediation advice, present only when the request announced an embedded hash that differs
   * from `hash`. The server owns this verdict because only it can tell a stale app apart from
   * stale generated native directories (which need `prebuild` before the rebuild).
   */
  mismatch?: MismatchAdvice;
}

export interface FingerprintMiddlewareOptions {
  /** Compute (or return the cached) project fingerprint; `null` when unresolvable. */
  getFingerprintAsync: (platform: FingerprintPlatform) => Promise<ServerFingerprint | null>;
  /**
   * Record the embedded fingerprint a client announced through the `expo-fingerprint` header.
   * Returns remediation advice on a mismatch, `null` on a match.
   */
  recordClientFingerprint: (
    platform: FingerprintPlatform,
    announcedHash: string,
    server: ServerFingerprint
  ) => MismatchAdvice | null;
}

/**
 * `GET /_expo/fingerprint?platform=<android|ios>` — returns the current project fingerprint so a
 * running app (or other tooling) can compare it against the fingerprint embedded at build time.
 * An optional `expo-fingerprint` request header announces the caller's embedded hash; the dev
 * server records it and warns when the installed app is stale.
 *
 * Note: `CorsMiddleware` sends no `Access-Control-Allow-Headers`, so browser callers cannot send
 * the announce header — native (Hermes) callers are unaffected, and web is not-applicable for
 * native rebuild checks anyway.
 */
export class FingerprintMiddleware extends ExpoMiddleware {
  constructor(
    projectRoot: string,
    protected options: FingerprintMiddlewareOptions
  ) {
    super(projectRoot, [FingerprintEndpoint]);
  }

  async handleRequestAsync(req: ServerRequest, res: ServerResponse): Promise<void> {
    disableResponseCache(res);
    res.setHeader('Content-Type', 'application/json');

    const method = (req.method ?? 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      res.statusCode = 405;
      res.setHeader('Allow', 'GET, HEAD');
      res.end(
        JSON.stringify({
          code: 'METHOD_NOT_ALLOWED',
          error: `Method ${method} is not allowed for this endpoint.`,
        })
      );
      return;
    }

    const platform = parsePlatformHeader(req);
    if (!platform) {
      res.statusCode = 400;
      res.end(
        JSON.stringify({
          code: 'MISSING_PLATFORM',
          error: 'A platform is required: pass ?platform= or the expo-platform header.',
        })
      );
      return;
    }
    if (platform !== 'android' && platform !== 'ios') {
      res.statusCode = 400;
      res.end(
        JSON.stringify({
          code: 'INVALID_PLATFORM',
          error: `Unsupported platform: ${platform}. Use "android" or "ios".`,
        })
      );
      return;
    }

    const server = await this.options.getFingerprintAsync(platform);
    if (!server) {
      res.statusCode = 503;
      res.end(
        JSON.stringify({
          code: 'FINGERPRINT_UNAVAILABLE',
          error:
            'The `expo` package (which provides `expo/fingerprint`) could not be resolved in the project.',
        })
      );
      return;
    }

    const announcedHash = req.headers['expo-fingerprint'];
    let mismatch: MismatchAdvice | null = null;
    if (typeof announcedHash === 'string' && announcedHash.length > 0) {
      mismatch = this.options.recordClientFingerprint(platform, announcedHash, server);
    }

    res.statusCode = 200;
    const response: FingerprintResponse = {
      platform,
      hash: server.hash,
      fingerprintVersion: server.fingerprintVersion,
      ...(mismatch ? { mismatch } : null),
    };
    res.end(JSON.stringify(response));
  }
}
