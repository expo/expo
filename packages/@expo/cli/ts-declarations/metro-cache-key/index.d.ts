// #region metro-cache-key
declare module 'metro-cache-key' {
  export { default } from 'metro-cache-key/src/index';
}

// See: https://github.com/facebook/metro/blob/v0.81.0/packages/metro-cache-key/src/index.js
declare module 'metro-cache-key/src/index' {
  function getCacheKey(files: string[]): string;
  export default getCacheKey;
}
