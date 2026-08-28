/* oxlint-disable no-var, object-shorthand, no-unused-vars -- see README: these are captured Hermes expressions, not package source. */
// Hypothesis 2: one self-contained expression that walks every fiber under every root and
// collects the interaction-relevant fields. Also reports the census the design needs —
// how many fibers exist, how many survive the filter, and what a host `stateNode` looks like
// on Fabric — so the depth/size cap can be chosen from measurements.
(function () {
  var g = typeof globalThis !== 'undefined' ? globalThis : this;
  var hook = g.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook || typeof hook.getFiberRoots !== 'function') {
    return { supported: false, reason: 'no-devtools-hook' };
  }

  // Fiber tags used below, from react-reconciler's ReactWorkTags.
  var FunctionComponent = 0;
  var ClassComponent = 1;
  var HostRoot = 3;
  var HostComponent = 5;
  var HostText = 6;
  var ForwardRef = 11;
  var MemoComponent = 14;
  var SimpleMemoComponent = 15;

  function nameOf(fiber) {
    var t = fiber.elementType != null ? fiber.elementType : fiber.type;
    if (typeof t === 'string') return t;
    if (typeof t === 'function') return t.displayName || t.name || 'Anonymous';
    if (t && typeof t === 'object') {
      if (t.displayName) return t.displayName;
      // forwardRef / memo wrap the real component under `render` or `type`.
      var inner = t.render || t.type;
      if (typeof inner === 'function') return inner.displayName || inner.name || 'Anonymous';
      if (typeof inner === 'string') return inner;
    }
    if (fiber.tag === HostText) return '#text';
    if (fiber.tag === HostRoot) return '#root';
    return 'Unknown';
  }

  var HANDLER_PROPS = ['onPress', 'onLongPress', 'onPressIn', 'onChangeText', 'onSubmitEditing', 'onValueChange'];

  var tagCensus = {};
  var totalFibers = 0;
  var maxDepth = 0;
  var withTestID = 0;
  var hostComponents = 0;
  var kept = [];
  var stateNodeSample = null;

  var rootArray = [];
  hook.getFiberRoots(1).forEach(function (r) {
    rootArray.push(r);
  });

  for (var ri = 0; ri < rootArray.length; ri++) {
    var stack = [{ fiber: rootArray[ri].current, depth: 0 }];
    while (stack.length) {
      var entry = stack.pop();
      var f = entry.fiber;
      if (!f) continue;
      totalFibers++;
      if (entry.depth > maxDepth) maxDepth = entry.depth;
      tagCensus[f.tag] = (tagCensus[f.tag] || 0) + 1;

      var props = f.memoizedProps;
      var isHost = f.tag === HostComponent;
      if (isHost) hostComponents++;

      if (isHost && stateNodeSample == null && f.stateNode) {
        var snKeys = [];
        for (var sk in f.stateNode) snKeys.push(sk);
        var canonicalKeys = [];
        if (f.stateNode.canonical) {
          for (var ck in f.stateNode.canonical) canonicalKeys.push(ck);
        }
        stateNodeSample = {
          forComponent: nameOf(f),
          ctor: f.stateNode.constructor ? String(f.stateNode.constructor.name) : null,
          keys: snKeys.sort(),
          canonicalKeys: canonicalKeys.sort(),
          hasMeasure: typeof f.stateNode.measure === 'function',
          publicInstanceCtor:
            f.stateNode.canonical && f.stateNode.canonical.publicInstance
              ? String(f.stateNode.canonical.publicInstance.constructor.name)
              : null,
        };
      }

      if (props && typeof props === 'object') {
        var handlers = [];
        for (var hi = 0; hi < HANDLER_PROPS.length; hi++) {
          if (typeof props[HANDLER_PROPS[hi]] === 'function') handlers.push(HANDLER_PROPS[hi]);
        }
        var testID = typeof props.testID === 'string' ? props.testID : null;
        if (testID) withTestID++;
        var text = null;
        if (typeof props.children === 'string') text = props.children;
        else if (typeof props.value === 'string') text = props.value;
        else if (typeof props.placeholder === 'string') text = props.placeholder;
        var label = typeof props.accessibilityLabel === 'string' ? props.accessibilityLabel : null;
        var role =
          typeof props.accessibilityRole === 'string'
            ? props.accessibilityRole
            : typeof props.role === 'string'
              ? props.role
              : null;

        if (testID || handlers.length || label || role || (isHost && text)) {
          kept.push({
            depth: entry.depth,
            tag: f.tag,
            component: nameOf(f),
            testID: testID,
            accessibilityLabel: label,
            accessibilityRole: role,
            text: text,
            handlers: handlers,
            interactive: handlers.length > 0,
            host: isHost,
          });
        }
      } else if (f.tag === HostText && typeof props === 'string') {
        kept.push({ depth: entry.depth, tag: f.tag, component: '#text', text: props, host: true });
      }

      if (f.sibling) stack.push({ fiber: f.sibling, depth: entry.depth });
      if (f.child) stack.push({ fiber: f.child, depth: entry.depth + 1 });
    }
  }

  return {
    supported: true,
    rootCount: rootArray.length,
    totalFibers: totalFibers,
    maxDepth: maxDepth,
    hostComponents: hostComponents,
    withTestID: withTestID,
    keptCount: kept.length,
    tagCensus: tagCensus,
    stateNodeSample: stateNodeSample,
    kept: kept,
  };
})();
