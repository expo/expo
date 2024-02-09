import { parse } from 'url';

import { ServerRequest } from './server.types';
import { CommandError } from '../../../utils/errors';

const debug = require('debug')(
  'expo:start:server:middleware:resolvePlatform'
) as typeof console.log;

/** Supported platforms */
export type RuntimePlatform = 'ios' | 'android';

/**
 * Extract the runtime platform from the server request.
 * 1. Query param `platform`: `?platform=ios`
 * 2. Header `expo-platform`: `'expo-platform': ios`
 * 3. Legacy header `exponent-platform`: `'exponent-platform': ios`
 *
 * Returns first item in the case of an array.
 */
export function parsePlatformHeader(req: ServerRequest): string | null {
  const url = parse(req.url!, /* parseQueryString */ true);
  const platform =
    url.query?.platform || req.headers['expo-platform'] || req.headers['exponent-platform'];
  return (Array.isArray(platform) ? platform[0] : platform) ?? null;
}

/** Guess the platform from the user-agent header. */
export function resolvePlatformFromUserAgentHeader(req: ServerRequest): string | null {
  let platform = null;
  const userAgent = req.headers['user-agent'];
  if (userAgent?.match(/Android/i)) {
    platform = 'android';
  }
  if (userAgent?.match(/iPhone|iPad/i)) {
    platform = 'ios';
  }
  debug(`Resolved platform ${platform} from user-agent header: ${userAgent}`);
  return platform;
}

/** Assert if the runtime platform is not included. */
export function assertMissingRuntimePlatform(platform?: any): asserts platform {
  if (!platform) {
    throw new CommandError(
      'PLATFORM_HEADER',
      `Must specify "expo-platform" header or "platform" query parameter`
    );
  }
}

/** Assert if the runtime platform is not correct. */
export function assertRuntimePlatform(platform: string): asserts platform is RuntimePlatform {
  const stringifiedPlatform = String(platform);
  if (!['android', 'ios', 'web'].includes(stringifiedPlatform)) {
    throw new CommandError(
      'PLATFORM_HEADER',
      `platform must be "android", "ios", or "web". Received: "${platform}"`
    );
  }
}
