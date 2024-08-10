// #region /

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-cache-key/src/index.js (entry point)
declare module '@expo/metro-config/metro-cache-key' {
  function getCacheKey(files: string[]): string;

  export = getCacheKey;
}
