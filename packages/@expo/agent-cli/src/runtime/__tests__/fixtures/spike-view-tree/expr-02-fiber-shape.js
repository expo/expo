/* oxlint-disable no-var, object-shorthand -- see README: these are captured Hermes expressions, not package source. */
// Hypothesis 2 probe, part 1: what does a fiber look like on this runtime (React 19.2.3 /
// react-native-renderer, Fabric, bridgeless)? Walks the first 40 fibers depth-first from the
// root and reports the shape rather than the tree, so the walk itself can be written against
// facts instead of assumptions.
(function () {
  var g = typeof globalThis !== 'undefined' ? globalThis : this;
  var hook = g.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  var roots = hook.getFiberRoots(1);
  var rootArray = [];
  roots.forEach(function (r) {
    rootArray.push(r);
  });
  var root = rootArray[0];

  var rootKeys = [];
  for (var rk in root) {
    rootKeys.push(rk);
  }

  function describeType(t) {
    if (t == null) return { kind: 'null' };
    if (typeof t === 'string') return { kind: 'string', value: t };
    if (typeof t === 'function') return { kind: 'function', name: t.name || null, displayName: t.displayName || null };
    if (typeof t === 'object') {
      var objKeys = [];
      for (var ok in t) objKeys.push(ok);
      return {
        kind: 'object',
        $$typeof: t.$$typeof ? String(t.$$typeof) : null,
        displayName: typeof t.displayName === 'string' ? t.displayName : null,
        keys: objKeys.sort().slice(0, 12),
      };
    }
    return { kind: typeof t };
  }

  var seen = [];
  var fiberKeysUnion = {};
  var stack = [{ fiber: root.current, depth: 0 }];
  var visited = 0;
  while (stack.length && seen.length < 40) {
    var entry = stack.pop();
    var f = entry.fiber;
    if (!f) continue;
    visited++;
    for (var fk in f) fiberKeysUnion[fk] = true;
    var props = f.memoizedProps;
    var propKeys = [];
    if (props && typeof props === 'object') {
      for (var pk in props) propKeys.push(pk);
    }
    seen.push({
      depth: entry.depth,
      tag: f.tag,
      key: f.key,
      elementType: describeType(f.elementType),
      typeSame: f.type === f.elementType,
      hasStateNode: f.stateNode != null,
      stateNodeType: f.stateNode == null ? null : typeof f.stateNode,
      stateNodeCtor:
        f.stateNode && f.stateNode.constructor ? String(f.stateNode.constructor.name) : null,
      propKeys: propKeys.sort(),
      hasOnPress: !!(props && typeof props.onPress === 'function'),
      testID: props && typeof props.testID === 'string' ? props.testID : undefined,
    });
    if (f.sibling) stack.push({ fiber: f.sibling, depth: entry.depth });
    if (f.child) stack.push({ fiber: f.child, depth: entry.depth + 1 });
  }

  return {
    rootCount: rootArray.length,
    rootKeys: rootKeys.sort(),
    rootTag: root.tag,
    currentTag: root.current ? root.current.tag : null,
    visited: visited,
    fiberKeys: Object.keys(fiberKeysUnion).sort(),
    nodes: seen,
  };
})();
