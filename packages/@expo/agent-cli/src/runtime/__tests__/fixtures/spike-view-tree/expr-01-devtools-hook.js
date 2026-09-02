/* oxlint-disable no-var, object-shorthand -- see README: these are captured Hermes expressions, not package source. */
// Hypothesis 1 probe: is the React DevTools global hook installed in an Expo Go dev bundle,
// and what does it expose? Sent verbatim as one `Runtime.evaluate` expression.
(function () {
  var g = typeof globalThis !== 'undefined' ? globalThis : this;
  var hook = g.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) {
    return { hookPresent: false };
  }
  var hookKeys = [];
  for (var k in hook) {
    hookKeys.push(k);
  }
  var renderers = [];
  if (hook.renderers && typeof hook.renderers.forEach === 'function') {
    hook.renderers.forEach(function (renderer, id) {
      var rendererKeys = [];
      for (var rk in renderer) {
        rendererKeys.push(rk);
      }
      var rootCount = null;
      var rootsError = null;
      try {
        var roots = hook.getFiberRoots ? hook.getFiberRoots(id) : null;
        rootCount = roots ? roots.size : null;
      } catch (e) {
        rootsError = String(e);
      }
      renderers.push({
        id: id,
        rendererPackageName: renderer.rendererPackageName,
        version: renderer.version,
        bundleType: renderer.bundleType,
        rendererKeys: rendererKeys.sort(),
        getFiberRootsCount: rootCount,
        getFiberRootsError: rootsError,
      });
    });
  }
  return {
    hookPresent: true,
    hookKeys: hookKeys.sort(),
    hasGetFiberRoots: typeof hook.getFiberRoots === 'function',
    renderersType: hook.renderers ? String(hook.renderers.constructor && hook.renderers.constructor.name) : null,
    rendererCount: hook.renderers ? hook.renderers.size : null,
    renderers: renderers,
    reactNativeVersion: g.__fbBatchedBridgeConfig ? 'bridge-config-present' : 'bridgeless',
  };
})();
