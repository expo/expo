/* oxlint-disable no-var, object-shorthand -- see README: these are captured Hermes expressions, not package source. */
// Hypothesis 5: can the same connection observe the effect of a call it just made?
// Re-walks the fibers and reports what the notes screen now holds: the TextInput's committed
// `value` prop, and every note row the FlatList has rendered. Sent as a second
// `Runtime.evaluate` after the type/tap expression, on the same debugger connection.
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
    return f.tag === 6 ? '#text' : 'Unknown';
  }

  var inputValues = [];
  var rowTexts = [];
  var notesScreenState = null;

  hook.getFiberRoots(1).forEach(function (root) {
    var stack = [root.current];
    while (stack.length) {
      var f = stack.pop();
      if (!f) continue;
      var p = f.memoizedProps;
      var name = nameOf(f);

      if (p && typeof p === 'object' && p.testID === 'note-input' && typeof p.value === 'string') {
        inputValues.push({ component: name, tag: f.tag, value: p.value });
      }
      if (f.tag === 6 && typeof p === 'string') {
        rowTexts.push(p);
      }
      // The screen component's own hook state, read straight off the fiber: draft then notes.
      if (name === 'NotesScreen' && f.memoizedState) {
        var hooks = [];
        var h = f.memoizedState;
        var guard = 0;
        while (h && guard < 10) {
          hooks.push(h.memoizedState);
          h = h.next;
          guard++;
        }
        notesScreenState = hooks;
      }

      if (f.sibling) stack.push(f.sibling);
      if (f.child) stack.push(f.child);
    }
  });

  return { inputValues: inputValues, rowTexts: rowTexts, notesScreenState: notesScreenState };
})();
