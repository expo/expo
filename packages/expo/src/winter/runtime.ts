import '../async-require/setup';

Object.defineProperty(globalThis, '__ExpoImportMetaRegistry', {
  value: require('./ImportMetaRegistry').ImportMetaRegistry,
  enumerable: false,
  writable: true,
});
