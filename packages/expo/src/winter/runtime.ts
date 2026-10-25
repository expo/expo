import '../async-require/setup';
// Keeps the bundle URL capture in the synchronous script phase, where `transform.inlineRequires`
// would otherwise defer it. See `initialScriptURL` in `../utils/getBundleUrl.web.ts`.
import '../utils/getBundleUrl';

Object.defineProperty(globalThis, '__ExpoImportMetaRegistry', {
  value: require('./ImportMetaRegistry').ImportMetaRegistry,
  enumerable: false,
  writable: true,
});

// Server rendering has no animation frames, but we need to stub these *temporarily* to work around
// react-native-worklets, see: https://github.com/software-mansion/react-native-reanimated/pull/10667
if (process.env.EXPO_SERVER && typeof globalThis.requestAnimationFrame !== 'function') {
  globalThis.requestAnimationFrame = () => 0;
  globalThis.cancelAnimationFrame = () => {};
}
