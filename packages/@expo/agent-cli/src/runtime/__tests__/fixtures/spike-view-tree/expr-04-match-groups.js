/* oxlint-disable no-var, object-shorthand -- see README: these are captured Hermes expressions, not package source. */
// Hypothesis 3 prerequisite: how many *elements* carry a testID, as opposed to how many fibers.
// A testID given in JSX lands on every fiber in the chain that forwards it to a host view, so
// counting fibers reports "6 matches" for one link. This groups a testID's fibers into maximal
// ancestor chains and reports one entry per chain, with the handler found by walking up from the
// deepest fiber of the chain.
(function () {
  var g = typeof globalThis !== 'undefined' ? globalThis : this;
  var hook = g.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  var HANDLERS = ['onPress', 'onChangeText', 'onLongPress', 'onValueChange', 'onSubmitEditing'];

  function nameOf(f) {
    var t = f.elementType != null ? f.elementType : f.type;
    if (typeof t === 'string') return t;
    if (typeof t === 'function') return t.displayName || t.name || 'Anonymous';
    if (t && typeof t === 'object') {
      if (t.displayName) return t.displayName;
      var inner = t.render || t.type;
      if (typeof inner === 'function') return inner.displayName || inner.name || 'Anonymous';
      if (typeof inner === 'string') return inner;
    }
    return f.tag === 6 ? '#text' : f.tag === 3 ? '#root' : 'Unknown';
  }
  function testIDOf(f) {
    var p = f.memoizedProps;
    return p && typeof p === 'object' && typeof p.testID === 'string' ? p.testID : null;
  }

  var all = [];
  hook.getFiberRoots(1).forEach(function (root) {
    var stack = [{ f: root.current, d: 0 }];
    while (stack.length) {
      var e = stack.pop();
      var f = e.f;
      if (!f) continue;
      if (testIDOf(f)) all.push({ f: f, d: e.d });
      if (f.sibling) stack.push({ f: f.sibling, d: e.d });
      if (f.child) stack.push({ f: f.child, d: e.d + 1 });
    }
  });

  // A fiber starts a group when no ancestor carries the same testID.
  var groups = [];
  for (var i = 0; i < all.length; i++) {
    var f = all[i].f;
    var id = testIDOf(f);
    var p = f['return'];
    var inherited = false;
    while (p) {
      if (testIDOf(p) === id) {
        inherited = true;
        break;
      }
      p = p['return'];
    }
    if (inherited) continue;

    // Every fiber under this one that still carries the same testID. The chain is NOT contiguous:
    // expo-router's Link forwards testID through components that do not carry it themselves, so
    // following only the immediate child stops before the fiber that owns the handler.
    var chain = [];
    var sub = [{ f: f, d: 0 }];
    var deepest = f;
    var deepestD = 0;
    while (sub.length) {
      var se = sub.pop();
      if (testIDOf(se.f) === id) {
        chain.push({ name: nameOf(se.f), d: se.d, tag: se.f.tag });
        if (se.d > deepestD) {
          deepestD = se.d;
          deepest = se.f;
        }
      }
      if (se.f !== f && se.f.sibling) sub.push({ f: se.f.sibling, d: se.d });
      if (se.f.child) sub.push({ f: se.f.child, d: se.d + 1 });
    }

    // Handler search: inside the group first (root to deepest), then up from the deepest fiber.
    var found = null;
    var probe = deepest;
    var up = 0;
    while (probe && up < 40) {
      var props = probe.memoizedProps;
      if (props && typeof props === 'object') {
        for (var h = 0; h < HANDLERS.length; h++) {
          if (typeof props[HANDLERS[h]] === 'function') {
            found = {
              handler: HANDLERS[h],
              on: nameOf(probe),
              stepsUp: up,
              tag: probe.tag,
              insideGroup: testIDOf(probe) === id,
            };
            break;
          }
        }
      }
      if (found) break;
      probe = probe['return'];
      up++;
    }

    groups.push({
      testID: id,
      depth: all[i].d,
      topComponent: nameOf(f),
      chain: chain,
      chainLength: chain.length,
      handlerFound: found,
    });
  }

  var byId = {};
  for (var k = 0; k < groups.length; k++) {
    byId[groups[k].testID] = (byId[groups[k].testID] || 0) + 1;
  }

  return { fibersWithTestID: all.length, elementCount: groups.length, countByTestID: byId, groups: groups };
})();
