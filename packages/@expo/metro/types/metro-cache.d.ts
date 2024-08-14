// #region /

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-cache/src/index.js (entry point)
declare module '@expo/metro/metro-cache' {
  export type { Options as FileOptions } from '@expo/metro/metro-cache/stores/FileStore';
  export type { Options as HttpOptions } from '@expo/metro/metro-cache/stores/HttpStore';
  export type { CacheStore } from '@expo/metro/metro-cache/types';

  export { default as AutoCleanFileStore } from '@expo/metro/metro-cache/stores/AutoCleanFileStore';
  export { default as Cache } from '@expo/metro/metro-cache/Cache';
  export { default as FileStore } from '@expo/metro/metro-cache/stores/FileStore';
  export { default as HttpGetStore } from '@expo/metro/metro-cache/stores/HttpGetStore';
  export { default as HttpStore } from '@expo/metro/metro-cache/stores/HttpStore';
  export { default as stableHash } from '@expo/metro/metro-cache/stableHash';
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-cache/src/Cache.js
declare module '@expo/metro/metro-cache/Cache' {
  export { default } from 'metro-cache/src/Cache';
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-cache/src/stableHash.js
declare module '@expo/metro/metro-cache/stableHash' {
  export { default } from 'metro-cache/src/stableHash';
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-cache/src/stableHash.js
declare module '@expo/metro/metro-cache/types' {
  export type { CacheStore } from 'metro-cache/src/types';
}

// #region /stores/

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-cache/src/stores/AutoCleanFileStore.js
declare module '@expo/metro/metro-cache/stores/AutoCleanFileStore' {
  export { default } from 'metro-cache/src/stores/AutoCleanFileStore';
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-cache/src/stores/FileStore.js
declare module '@expo/metro/metro-cache/stores/FileStore' {
  export { default, type Options } from 'metro-cache/src/stores/FileStore';
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-cache/src/stores/HttpError.js
declare module '@expo/metro/metro-cache/stores/HttpError' {
  export default class HttpError extends Error {
    code: number;
    constructor(message: string, code: number);
  }
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-cache/src/stores/HttpGetStore.js
declare module '@expo/metro/metro-cache/stores/HttpGetStore' {
  export { default } from 'metro-cache/src/stores/HttpGetStore';
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-cache/src/stores/HttpStore.js
declare module '@expo/metro/metro-cache/stores/HttpStore' {
  export { default, type Options } from 'metro-cache/src/stores/HttpStore';
}

// See: https://github.com/facebook/metro/blob/v0.80.9/packages/metro-cache/src/stores/NetworkError.js
declare module '@expo/metro/metro-cache/stores/NetworkError' {
  export default class NetworkError extends Error {
    code: string;
    constructor(message: string, code: string);
  }
}
