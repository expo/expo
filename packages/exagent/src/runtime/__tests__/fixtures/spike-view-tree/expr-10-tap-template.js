/* oxlint-disable no-var, object-shorthand -- see README: these are captured Hermes expressions, not package source. */
// The tap expression as the command would build it: one testID interpolated into an otherwise
// fixed source. `__TESTID_JSON__` is replaced with `JSON.stringify(testID)` before sending, which
// is the only place caller input enters the expression.
//
// Rules this encodes, each measured in this spike:
//   - Match by *element*, not by fiber: a testID lands on every fiber in the chain that forwards
//     it to a host view, so counting fibers reports 6 matches for one link.
//   - Take the handler from the shallowest fiber of the group that carries it: that is the prop
//     the app author wrote, not a library's internal press wrapper.
//   - Search outside the group only when the group has no handler, and say so in the answer, so
//     "the tap landed on the card that wraps the target" is visible rather than silent.
(function () {
  var g = typeof globalThis !== 'undefined' ? globalThis : this;
  var hook = g.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook || typeof hook.getFiberRoots !== 'function') {
    return { ok: false, reason: 'no-devtools-hook' };
  }
  var TARGET = __TESTID_JSON__;
  var HANDLER = 'onPress';

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

  var roots = [];
  hook.getFiberRoots(1).forEach(function (r) {
    roots.push(r);
  });

  var groupRoots = [];
  for (var ri = 0; ri < roots.length; ri++) {
    var stack = [roots[ri].current];
    while (stack.length) {
      var f = stack.pop();
      if (!f) continue;
      if (testIDOf(f) === TARGET) {
        var p = f['return'];
        var inherited = false;
        while (p) {
          if (testIDOf(p) === TARGET) {
            inherited = true;
            break;
          }
          p = p['return'];
        }
        if (!inherited) groupRoots.push(f);
      }
      if (f.sibling) stack.push(f.sibling);
      if (f.child) stack.push(f.child);
    }
  }
  if (groupRoots.length === 0) return { ok: false, reason: 'no-match', matched: 0 };
  if (groupRoots.length > 1) return { ok: false, reason: 'ambiguous', matched: groupRoots.length };

  var group = [];
  var sub = [{ f: groupRoots[0], d: 0 }];
  while (sub.length) {
    var e = sub.pop();
    if (testIDOf(e.f) === TARGET) group.push({ f: e.f, d: e.d });
    if (e.f !== groupRoots[0] && e.f.sibling) sub.push({ f: e.f.sibling, d: e.d });
    if (e.f.child) sub.push({ f: e.f.child, d: e.d + 1 });
  }
  group.sort(function (a, b) {
    return a.d - b.d;
  });

  var handlerFiber = null;
  var outside = false;
  for (var i = 0; i < group.length && !handlerFiber; i++) {
    var props = group[i].f.memoizedProps;
    if (props && typeof props[HANDLER] === 'function') handlerFiber = group[i].f;
  }
  if (!handlerFiber) {
    outside = true;
    var probe = group[group.length - 1].f['return'];
    var up = 0;
    while (probe && up < 40 && !handlerFiber) {
      var pp = probe.memoizedProps;
      if (pp && typeof pp === 'object' && typeof pp[HANDLER] === 'function') handlerFiber = probe;
      probe = probe['return'];
      up++;
    }
  }
  if (!handlerFiber) {
    return { ok: false, reason: 'no-handler', matched: 1, component: nameOf(groupRoots[0]) };
  }

  var threw = null;
  try {
    handlerFiber.memoizedProps[HANDLER]({
      nativeEvent: { locationX: 0, locationY: 0, pageX: 0, pageY: 0, timestamp: Date.now(), touches: [], changedTouches: [] },
      target: null,
      currentTarget: null,
      preventDefault: function () {},
      stopPropagation: function () {},
      persist: function () {},
    });
  } catch (err) {
    threw = { text: String(err), stack: err && err.stack ? String(err.stack).split('\n').slice(0, 6).join('\n') : null };
  }

  return {
    ok: threw == null,
    testID: TARGET,
    matched: 1,
    handler: HANDLER,
    component: nameOf(groupRoots[0]),
    handlerOn: nameOf(handlerFiber),
    handlerOutsideMatch: outside,
    threw: threw,
  };
})();
