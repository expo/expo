// #region metro-cache-key
declare module 'metro-cache-key' {
  export * from 'metro-cache-key/private/index';
}

// See: https://github.com/facebook/metro/blob/v0.83.0/packages/metro-cache-key/src/index.js
declare module 'metro-cache-key/private/index' {
  export function getCacheKey(files: string[]): string;
}
