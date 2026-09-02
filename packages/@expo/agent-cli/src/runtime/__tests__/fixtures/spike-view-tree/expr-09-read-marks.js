/* oxlint-disable no-var, object-shorthand -- see README: these are captured Hermes expressions, not package source. */
// Verification read for expr-08: the screen renders `marks:<who>,<who>` into a Text whose testID
// is "spike-marks", so what the taps actually ran is readable off the committed props.
(function () {
  var g = typeof globalThis !== 'undefined' ? globalThis : this;
  var hook = g.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  var found = [];
  hook.getFiberRoots(1).forEach(function (root) {
    var stack = [root.current];
    while (stack.length) {
      var f = stack.pop();
      if (!f) continue;
      var p = f.memoizedProps;
      if (p && typeof p === 'object' && p.testID === 'spike-marks' && typeof p.children === 'string') {
        found.push(p.children);
      }
      if (f.sibling) stack.push(f.sibling);
      if (f.child) stack.push(f.child);
    }
  });
  return { marks: found };
})();
