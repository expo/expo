import '../async-require/setup';
// On web, `getBundleUrl` captures `document.currentScript` when its module first evaluates, and
// `document.currentScript` is only set during synchronous script execution. `ImportMetaRegistry`
// requires that module inside a getter, so `transform.inlineRequires` defers the evaluation to the
// first read of `import.meta.url`, when the capture is already `null`. This module runs before the
// main module, so importing it here for its side effect keeps the capture in the synchronous phase.
import '../utils/getBundleUrl';

Object.defineProperty(globalThis, '__ExpoImportMetaRegistry', {
  value: require('./ImportMetaRegistry').ImportMetaRegistry,
  enumerable: false,
  writable: true,
});
