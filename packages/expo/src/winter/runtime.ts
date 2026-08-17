import '../async-require/setup';
// Keeps the bundle URL capture in the synchronous script phase, where `transform.inlineRequires`
// would otherwise defer it. See `initialScriptURL` in `../utils/getBundleUrl.web.ts`.
import '../utils/getBundleUrl';

Object.defineProperty(globalThis, '__ExpoImportMetaRegistry', {
  value: require('./ImportMetaRegistry').ImportMetaRegistry,
  enumerable: false,
  writable: true,
});
