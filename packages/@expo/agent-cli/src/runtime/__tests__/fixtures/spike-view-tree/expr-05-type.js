/* oxlint-disable no-var, object-shorthand -- see README: these are captured Hermes expressions, not package source. */
// Hypothesis 4: does calling `onChangeText` on a TextInput fiber update state and the UI?
// Types "spike-typed-note" into the element whose testID is "note-input", and reports the
// props before the call plus which fibers in the group carry the handler (and whether they
// carry the *same* function object, which decides whether the shallowest or the deepest
// fiber is the right one to call).
(function () {
  var g = typeof globalThis !== 'undefined' ? globalThis : this;
  var hook = g.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  var TARGET = 'note-input';
  var TEXT = 'spike-typed-note';

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
  function testIDOf(f) {
    var p = f.memoizedProps;
    return p && typeof p === 'object' && typeof p.testID === 'string' ? p.testID : null;
  }

  var group = [];
  hook.getFiberRoots(1).forEach(function (root) {
    var stack = [root.current];
    while (stack.length) {
      var f = stack.pop();
      if (!f) continue;
      if (testIDOf(f) === TARGET) group.push(f);
      if (f.sibling) stack.push(f.sibling);
      if (f.child) stack.push(f.child);
    }
  });
  if (!group.length) return { ok: false, reason: 'no-match' };

  var carriers = [];
  var fn = null;
  for (var i = 0; i < group.length; i++) {
    var p = group[i].memoizedProps;
    if (p && typeof p.onChangeText === 'function') {
      if (fn == null) fn = p.onChangeText;
      carriers.push({
        component: nameOf(group[i]),
        tag: group[i].tag,
        sameFunctionAsFirst: p.onChangeText === fn,
        valueBefore: typeof p.value === 'string' ? p.value : null,
      });
    }
  }
  if (fn == null) return { ok: false, reason: 'no-handler', groupSize: group.length };

  var threw = null;
  try {
    fn(TEXT);
  } catch (e) {
    threw = String(e);
  }

  return {
    ok: threw == null,
    testID: TARGET,
    text: TEXT,
    groupSize: group.length,
    carriers: carriers,
    threw: threw,
  };
})();
