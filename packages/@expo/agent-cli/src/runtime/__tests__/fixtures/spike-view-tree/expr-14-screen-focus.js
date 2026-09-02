/* oxlint-disable no-var, object-shorthand -- see README: these are captured Hermes expressions, not package source. */
// Where "which screen is the user looking at" is answerable. React's own Offscreen fibers say
// nothing here (see expr-13): this app uses native tabs, so the switching happens natively. React
// Navigation's `Screen` component carries `isFocused` and the route name, and the unfocused
// `RNSTabsScreenIOS` hosts carry `pointerEvents: "none"` — two signals that agree.
(function () {
  var g = typeof globalThis !== 'undefined' ? globalThis : this;
  var hook = g.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  function nameOf(f) {
    var t = f.elementType != null ? f.elementType : f.type;
    if (typeof t === 'string') return t;
    if (typeof t === 'function') return t.displayName || t.name || 'Anonymous';
    if (t && typeof t === 'object') { if (t.displayName) return t.displayName; var i = t.render || t.type; if (typeof i === 'function') return i.displayName || i.name || 'Anonymous'; }
    return 'Unknown';
  }
  var out = [];
  hook.getFiberRoots(1).forEach(function (root) {
    var stack = [{f:root.current,d:0}];
    while (stack.length) {
      var e = stack.pop(); var f = e.f; if (!f) continue;
      var n = nameOf(f);
      if (n === 'RNSTabsScreenIOS' || n === 'RNSTabsHostIOS' || n === 'Screen' || n === 'NativeTabTrigger' || n === 'BottomTabsScreen') {
        var p = f.memoizedProps; var keys = []; var vals = {};
        if (p && typeof p === 'object') { for (var k in p) { keys.push(k); var v = p[k]; if (typeof v !== 'object' && typeof v !== 'function') vals[k] = v; } }
        out.push({ name: n, depth: e.d, keys: keys.sort(), scalarProps: vals });
      }
      if (f.sibling) stack.push({f:f.sibling,d:e.d});
      if (f.child) stack.push({f:f.child,d:e.d+1});
    }
  });
  return { nodes: out };
})();
