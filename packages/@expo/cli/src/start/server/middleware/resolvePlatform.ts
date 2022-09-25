import { parse } from 'url';

import { CommandError } from '../../../utils/errors';
import { ServerRequest } from './server.types';

/** Supported platforms */
export type RuntimePlatform = 'ios' | 'android';

/**
 * Extract the runtime platform from the server request.
 * 1. Query param `platform`: `?platform=ios`
 * 2. Header `expo-platform`: `'expo-platform': ios`
 * 2. Legacy header `exponent-platform`: `'exponent-platform': ios`
 *
 * Returns first item in the case of an array.
 */
export function parsePlatformHeader(req: ServerRequest): string | null {
  const url = parse(req.url!, /* parseQueryString */ true);
  const platform =
    url.query?.platform || req.headers['expo-platform'] || req.headers['exponent-platform'];
  return (Array.isArray(platform) ? platform[0] : platform) ?? null;
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
  if (!['android', 'ios'].includes(stringifiedPlatform)) {
    throw new CommandError(
      'PLATFORM_HEADER',
      `platform must be "android" or "ios". Received: "${platform}"`
    );
  }
}
