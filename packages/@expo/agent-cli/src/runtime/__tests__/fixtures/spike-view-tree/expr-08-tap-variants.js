/* oxlint-disable no-var, object-shorthand -- see README: these are captured Hermes expressions, not package source. */
// Hypothesis 3, second half: does the same tap work for `TouchableOpacity` and for
// react-native-gesture-handler components? Taps three testIDs in one expression and reports
// which fiber of each group owned the handler.
//
// The handler is taken from the SHALLOWEST fiber of the testID group that carries `onPress`.
// That is the component the app author wrote the prop on, so the function invoked is the app's
// own handler rather than a library's internal press wrapper — which matters for
// react-native-gesture-handler, where the same prop name appears again several fibers deeper on
// `InnerBaseButton` and on the host `RNGestureHandlerButton`.
(function () {
  var g = typeof globalThis !== 'undefined' ? globalThis : this;
  var hook = g.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  var TARGETS = ['spike-touchable', 'spike-gh-touchable', 'spike-gh-rectbutton'];

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
  function makeEvent() {
    return {
      nativeEvent: { locationX: 0, locationY: 0, pageX: 0, pageY: 0, timestamp: Date.now(), touches: [], changedTouches: [] },
      target: null,
      currentTarget: null,
      preventDefault: function () {},
      stopPropagation: function () {},
      persist: function () {},
    };
  }

  var roots = [];
  hook.getFiberRoots(1).forEach(function (r) {
    roots.push(r);
  });

  var out = [];
  for (var ti = 0; ti < TARGETS.length; ti++) {
    var TARGET = TARGETS[ti];
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
      out.push({ testID: TARGET, ok: false, reason: 'ambiguous-or-missing', matched: groupRoots.length });
      continue;
    }

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
    var carriers = [];
    for (var i = 0; i < group.length; i++) {
      var props = group[i].f.memoizedProps;
      if (props && typeof props.onPress === 'function') {
        carriers.push({ component: nameOf(group[i].f), depthInGroup: group[i].d, tag: group[i].f.tag });
        if (!handlerFiber) handlerFiber = group[i].f;
      }
    }
    if (!handlerFiber) {
      out.push({ testID: TARGET, ok: false, reason: 'no-handler', group: group.map(function (x) { return nameOf(x.f); }) });
      continue;
    }

    var threw = null;
    try {
      handlerFiber.memoizedProps.onPress(makeEvent());
    } catch (err) {
      threw = { text: String(err), stack: err && err.stack ? String(err.stack).split('\n').slice(0, 4).join('\n') : null };
    }
    out.push({
      testID: TARGET,
      ok: threw == null,
      group: group.map(function (x) { return nameOf(x.f); }),
      onPressCarriers: carriers,
      calledOn: nameOf(handlerFiber),
      calledOnTag: handlerFiber.tag,
      threw: threw,
    });
  }
  return { taps: out };
})();
