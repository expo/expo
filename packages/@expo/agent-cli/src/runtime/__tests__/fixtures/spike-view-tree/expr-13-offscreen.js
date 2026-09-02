/* oxlint-disable no-var, object-shorthand -- see README: these are captured Hermes expressions, not package source. */
// The problem the census in out-03 exposed: while the app is on /notes, the fibers of / and
// /explore are still mounted, so a walk of every root reports elements the user cannot see and a
// tap could fire a handler on a screen that is not on screen.
//
// This asks what the runtime itself knows about that: React's Offscreen fibers, and
// react-native-screens' RNSScreen host views, which carry the navigator's own activity state.
(function () {
  var g = typeof globalThis !== 'undefined' ? globalThis : this;
  var hook = g.__REACT_DEVTOOLS_GLOBAL_HOOK__;

  function nameOf(f) {
    var t = f.elementType != null ? f.elementType : f.type;
    if (typeof t === 'string') return t;
    if (typeof t === 'function') return t.displayName || t.name || 'Anonymous';
    if (t && typeof t === 'object') {
      if (t.displayName) return t.displayName;
      var inner = t.render || t.type;
      if (typeof inner === 'function') return inner.displayName || inner.name || 'Anonymous';
    }
    return 'Unknown';
  }

  var offscreen = [];
  var screens = [];
  var hostTagNames = {};

  hook.getFiberRoots(1).forEach(function (root) {
    var stack = [{ f: root.current, d: 0 }];
    while (stack.length) {
      var e = stack.pop();
      var f = e.f;
      if (!f) continue;
      var p = f.memoizedProps;
      var name = nameOf(f);

      if (typeof (f.elementType != null ? f.elementType : f.type) === 'string') {
        hostTagNames[name] = (hostTagNames[name] || 0) + 1;
      }

      // React marks a hidden Offscreen boundary by putting a non-null memoizedState on it.
      if (f.tag === 22) {
        offscreen.push({
          depth: e.d,
          mode: p && typeof p === 'object' ? p.mode : null,
          hiddenByMemoizedState: f.memoizedState != null,
        });
      }

      if (name === 'RNSScreen' || name === 'RNSScreenStack' || name === 'RNSScreenContainer') {
        screens.push({
          depth: e.d,
          host: name,
          activityState: p && typeof p === 'object' ? p.activityState : undefined,
          style: p && typeof p === 'object' && p.style ? JSON.stringify(p.style).slice(0, 120) : null,
        });
      }

      if (f.sibling) stack.push({ f: f.sibling, d: e.d });
      if (f.child) stack.push({ f: f.child, d: e.d + 1 });
    }
  });

  return { offscreenCount: offscreen.length, offscreen: offscreen, screens: screens, hostTagNames: hostTagNames };
})();
