// #region metro-cache-key
declare module 'metro-cache-key' {
  export { default } from 'metro-cache-key/src/index';
}

// See: https://github.com/facebook/metro/blob/v0.80.12/packages/metro-cache-key/src/index.js
declare module 'metro-cache-key/src/index' {
  function getCacheKey(files: Array<string>): string;
  export default getCacheKey;
}
