/* oxlint-disable no-var, object-shorthand -- see README: these are captured Hermes expressions, not package source. */
// Hypothesis 3: from a fiber carrying `testID`, find the nearest `onPress` and invoke it.
// Taps the element whose testID is "add-note" (a `Pressable`). The handler is searched inside
// the testID group first — every fiber that carries the same testID, root to deepest — and only
// then up the ancestor chain, so a tap does not silently land on a card that wraps the target.
//
// The handler is called with a synthetic event: React Native press handlers are given a
// GestureResponderEvent, and a handler that reads `event.nativeEvent` would throw on `undefined`.
(function () {
  var g = typeof globalThis !== 'undefined' ? globalThis : this;
  var hook = g.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  var TARGET = 'add-note';

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

  // Group roots: a fiber with this testID whose ancestors do not carry it.
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
  if (groupRoots.length !== 1) {
    return { ok: false, reason: 'ambiguous-or-missing', matched: groupRoots.length };
  }

  // Every fiber of the group, shallowest first.
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
  var searchedOutsideGroup = false;
  for (var i = 0; i < group.length; i++) {
    var props = group[i].f.memoizedProps;
    if (props && typeof props.onPress === 'function') {
      handlerFiber = group[i].f;
      break;
    }
  }
  if (!handlerFiber) {
    searchedOutsideGroup = true;
    var probe = group[group.length - 1].f['return'];
    var up = 0;
    while (probe && up < 40) {
      var pp = probe.memoizedProps;
      if (pp && typeof pp === 'object' && typeof pp.onPress === 'function') {
        handlerFiber = probe;
        break;
      }
      probe = probe['return'];
      up++;
    }
  }
  if (!handlerFiber) {
    return { ok: false, reason: 'no-handler', groupSize: group.length };
  }

  var syntheticEvent = {
    nativeEvent: {
      changedTouches: [],
      identifier: 1,
      locationX: 0,
      locationY: 0,
      pageX: 0,
      pageY: 0,
      target: null,
      timestamp: Date.now(),
      touches: [],
    },
    currentTarget: null,
    target: null,
    bubbles: false,
    cancelable: false,
    defaultPrevented: false,
    eventPhase: 0,
    isTrusted: false,
    timeStamp: Date.now(),
    preventDefault: function () {},
    stopPropagation: function () {},
    isDefaultPrevented: function () {
      return false;
    },
    isPropagationStopped: function () {
      return false;
    },
    persist: function () {},
  };

  var threw = null;
  var returned;
  try {
    returned = handlerFiber.memoizedProps.onPress(syntheticEvent);
  } catch (err) {
    threw = { text: String(err), stack: err && err.stack ? String(err.stack) : null };
  }

  return {
    ok: threw == null,
    testID: TARGET,
    matched: groupRoots.length,
    groupSize: group.length,
    groupComponents: group.map(function (x) {
      return nameOf(x.f);
    }),
    handler: 'onPress',
    handlerOn: nameOf(handlerFiber),
    handlerTag: handlerFiber.tag,
    searchedOutsideGroup: searchedOutsideGroup,
    returnedType: typeof returned,
    threw: threw,
  };
})();
