import crypto from 'crypto';
import { readFileSync } from 'fs';

export const cacheKeyParts = [
  readFileSync(__filename),
  // Since babel-preset-fbjs cannot be safely resolved relative to the
  // project root, use this environment variable that we define earlier.
  process.env.EXPO_METRO_CACHE_KEY_VERSION || '3.3.0',
  //   require('babel-preset-fbjs/package.json').version,
];

// Matches upstream
export function getCacheKey(): string {
  const key = crypto.createHash('md5');
  cacheKeyParts.forEach(part => key.update(part));
  return key.digest('hex');
}
