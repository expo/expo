/* oxlint-disable no-var, object-shorthand -- see README: these are captured Hermes expressions, not package source. */
// Does `disabled` take `onPress` off a Pressable's props? If it does not, a tap found by walking
// fibers runs the handler of a button the user cannot press. Compares a `disabled` Pressable
// against the enabled `add-note` button beside it.
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
    var stack = [root.current];
    while (stack.length) {
      var f = stack.pop(); if (!f) continue;
      var p = f.memoizedProps;
      if (p && typeof p === 'object' && (p.testID === 'disabled-btn' || p.testID === 'add-note')) {
        out.push({
          testID: p.testID,
          component: nameOf(f),
          hasOnPress: typeof p.onPress === 'function',
          disabledProp: p.disabled === undefined ? '<absent>' : p.disabled,
          ariaDisabled: p['aria-disabled'] === undefined ? '<absent>' : p['aria-disabled'],
          accessibilityState: p.accessibilityState ? JSON.stringify(p.accessibilityState) : null,
          pointerEvents: p.pointerEvents === undefined ? '<absent>' : p.pointerEvents,
        });
      }
      if (f.sibling) stack.push(f.sibling);
      if (f.child) stack.push(f.child);
    }
  });
  return { nodes: out };
})();
