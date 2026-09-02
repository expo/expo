// @ref llp/0018-interaction-commands.rfc.md
// The three expressions `runtime:tree`, `runtime:tap` and `runtime:type` send to the app, as source.
//
// Every rule of this feature lives here rather than in TypeScript, because the fiber tree only
// exists inside the app: one `Runtime.evaluate` walks it, decides, and answers with a value. The
// CLI around this module builds the string, sends it through the same `CdpClient.evaluateAsync` that
// `runtime:eval` uses, and formats what comes back — it never sees a fiber.
//
// Five properties this is built around, each measured by the spike
// (llp/0018-interaction-commands.rfc.md §Must not lose):
//
//  1. **One guard, one refusal.** No `__REACT_DEVTOOLS_GLOBAL_HOOK__`, or a hook with no
//     `getFiberRoots`, answers `{supported: false}` and nothing else. A partial tree is worse than
//     no tree: an agent cannot tell "this screen has no button" from "I could not look".
//  2. **No React fiber tag numbers.** The numeric `tag` values (`5` host, `6` text, `15` memo) are
//     renumbered between React versions, and a wrong number misclassifies silently.
//     `typeof elementType === 'string'` answers "is this a host component" without any of them.
//  3. **A match is an element, not a fiber.** A `testID` written once in JSX lands on every fiber in
//     the chain that forwards props to a host view — 17 fibers for 4 elements in the app the spike
//     ran against — so a match is a fiber *no ancestor of which carries the same testID*.
//  4. **A group is not a contiguous chain.** `expo-router`'s `Link` forwards `testID` through two
//     components that do not carry it, so the fiber that owns `onPress` is four levels below a gap.
//     The group is the whole subtree filtered by testID, never the child pointer followed once.
//  5. **The shallowest handler in the group wins.** `RectButton` puts `onPress` on six fibers of one
//     group, and only the shallowest is the app's own function; the deepest is the gesture library's
//     internal press handler, which expects the library's event rather than ours.
//
// The only caller input that ever enters an expression is a `testID` and the text to type, and both
// go in as `JSON.stringify`, which is what keeps this from being string-built code with a hole in it.

/** Props that make a node interactive, in the order the report lists them. */
export const HANDLER_PROPS = [
  'onPress',
  'onLongPress',
  'onPressIn',
  'onChangeText',
  'onSubmitEditing',
  'onValueChange',
] as const;

/**
 * How far the handler search walks **up** past a match that has none.
 *
 * Only reached when the group carries no handler at all: tapping a `Text` inside a card would
 * otherwise silently fire the card's handler, which is what a real touch does and not what the
 * agent asked for. Bounded because the fiber depth of a real screen is around 150 (llp/0018-interaction-commands.rfc.md
 * §Correction 1), so an unbounded walk would reach the root and call whatever is on it.
 */
const MAX_HANDLER_WALK_UP = 40;

/**
 * The shared half of every expression: the guard, the fiber readers, and the two walks.
 *
 * Inlined into each expression rather than parked on a global in the app: an expression that
 * depends on a previous one having run is an expression that fails differently on the second call
 * than on the first, and every one of these has to be answerable on a connection that was opened a
 * moment ago.
 */
const PRELUDE = `
  var g = typeof globalThis !== 'undefined' ? globalThis : this;
  var hook = g.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook || typeof hook.getFiberRoots !== 'function') {
    return { supported: false, reason: !hook ? 'no-devtools-hook' : 'no-get-fiber-roots' };
  }

  var HANDLER_PROPS = ${JSON.stringify(HANDLER_PROPS)};

  function typeOf(f) {
    return f.elementType != null ? f.elementType : f.type;
  }
  /** Host components are the ones whose element type is a string. No fiber tag numbers. */
  function isHost(f) {
    return typeof typeOf(f) === 'string';
  }
  function nameOf(f) {
    var t = typeOf(f);
    if (typeof t === 'string') return t;
    if (typeof t === 'function') return t.displayName || t.name || 'Anonymous';
    if (t && typeof t === 'object') {
      if (t.displayName) return t.displayName;
      var inner = t.render || t.type;
      if (typeof inner === 'function') return inner.displayName || inner.name || 'Anonymous';
      if (typeof inner === 'string') return inner;
    }
    return typeof f.memoizedProps === 'string' ? '#text' : 'Unknown';
  }
  function propsOf(f) {
    var p = f.memoizedProps;
    return p && typeof p === 'object' ? p : null;
  }
  function testIDOf(f) {
    var p = propsOf(f);
    return p && typeof p.testID === 'string' ? p.testID : null;
  }
  /** Which prop says this element is disabled, or null when none does. */
  function disabledOn(f) {
    var p = propsOf(f);
    if (!p) return null;
    if (p.disabled === true) return 'disabled';
    if (p.editable === false) return 'editable';
    var s = p.accessibilityState;
    if (s && typeof s === 'object' && s.disabled === true) return 'accessibilityState.disabled';
    if (p['aria-disabled'] === true) return 'aria-disabled';
    return null;
  }
  function handlersOf(f) {
    var p = propsOf(f);
    var found = [];
    if (!p) return found;
    for (var i = 0; i < HANDLER_PROPS.length; i++) {
      if (typeof p[HANDLER_PROPS[i]] === 'function') found.push(HANDLER_PROPS[i]);
    }
    return found;
  }
  /**
   * React Navigation's own \`Screen\`, which is where "which screen is the user looking at" is
   * answerable. React itself does not know: with native tabs the switching happens natively and
   * every \`Offscreen\` fiber still reports \`mode: "visible"\` (llp/0018-interaction-commands.rfc.md §Must not lose).
   */
  function screenOf(f) {
    if (nameOf(f) !== 'Screen') return null;
    var p = propsOf(f);
    if (!p || typeof p.isFocused !== 'boolean' || typeof p.name !== 'string') return null;
    return { name: p.name, focused: p.isFocused };
  }

  var roots = [];
  hook.getFiberRoots(1).forEach(function (r) { roots.push(r); });

  /** Pre-order walk of the subtree under one fiber. Siblings of that fiber are not visited. */
  function walkSubtree(fiber, visit) {
    var stack = [{ f: fiber, d: 0 }];
    while (stack.length) {
      var e = stack.pop();
      visit(e.f, e.d);
      var kids = [];
      for (var c = e.f.child; c; c = c.sibling) kids.push(c);
      for (var i = kids.length - 1; i >= 0; i--) stack.push({ f: kids[i], d: e.d + 1 });
    }
  }

  var screensSeen = [];
  var focusedScreen = null;
  var focusedScreenDepth = -1;

  /**
   * Every fiber of every root, in document order, with the focus context of each.
   *
   * A fiber is off the focused screen when **any** \`Screen\` ancestor of it is unfocused, which is
   * the rule that also holds for a stack inside a focused tab: there the inner screen and the outer
   * one are both focused, and nothing has to choose between them.
   */
  function walkAll(visit) {
    for (var ri = 0; ri < roots.length; ri++) {
      var stack = [{ f: roots[ri].current, d: 0, unfocused: false, screen: null }];
      while (stack.length) {
        var e = stack.pop();
        var unfocused = e.unfocused;
        var screen = e.screen;
        var s = screenOf(e.f);
        if (s) {
          if (screensSeen.indexOf(s.name) < 0) screensSeen.push(s.name);
          screen = s.name;
          if (!s.focused) {
            unfocused = true;
          } else if (!unfocused && e.d > focusedScreenDepth) {
            focusedScreen = s.name;
            focusedScreenDepth = e.d;
          }
        }
        visit(e.f, e.d, unfocused, screen);
        var kids = [];
        for (var c = e.f.child; c; c = c.sibling) kids.push(c);
        for (var i = kids.length - 1; i >= 0; i--) {
          stack.push({ f: kids[i], d: e.d + 1, unfocused: unfocused, screen: screen });
        }
      }
    }
  }

  /** Whether an ancestor carries the same testID, i.e. this fiber is inside an element, not its top. */
  function insideSameElement(f, target) {
    var p = f['return'];
    while (p) {
      if (testIDOf(p) === target) return true;
      p = p['return'];
    }
    return false;
  }

  /**
   * The **elements** carrying one testID: fibers no ancestor of which carries the same one.
   *
   * Counting fibers instead would report "3 matches, pass --index" for a button that appears once,
   * on every single call (llp/0018-interaction-commands.rfc.md §Must not lose).
   */
  function matchElements(target) {
    var found = [];
    walkAll(function (f, d, unfocused, screen) {
      if (testIDOf(f) !== target) return;
      if (insideSameElement(f, target)) return;
      found.push({ f: f, d: d, u: unfocused, s: screen });
    });
    return found;
  }

  /** A match plus every descendant carrying the same testID, shallowest first. */
  function groupOf(root, target) {
    var group = [];
    walkSubtree(root, function (f, d) {
      if (testIDOf(f) === target) group.push({ f: f, d: d });
    });
    group.sort(function (a, b) { return a.d - b.d; });
    return group;
  }

  /** Which prop of which fiber of the group says the element is disabled, or null. */
  function groupDisabledOn(group) {
    for (var i = 0; i < group.length; i++) {
      var on = disabledOn(group[i].f);
      if (on) return { on: on, component: nameOf(group[i].f) };
    }
    return null;
  }

  /**
   * The handler to call: the shallowest fiber of the group that has one, and only if the group has
   * none does the search walk up past the match — reporting that it did.
   */
  function findHandler(group, prop) {
    for (var i = 0; i < group.length; i++) {
      var p = propsOf(group[i].f);
      if (p && typeof p[prop] === 'function') return { f: group[i].f, outside: false };
    }
    var probe = group[group.length - 1].f['return'];
    var up = 0;
    while (probe && up < ${MAX_HANDLER_WALK_UP}) {
      var pp = propsOf(probe);
      if (pp && typeof pp[prop] === 'function') return { f: probe, outside: true };
      probe = probe['return'];
      up++;
    }
    return null;
  }

  /**
   * A stand-in for the \`GestureResponderEvent\` React Native gives a press handler.
   *
   * It is not a real event and never will be: there is no responder chain behind it, so a handler
   * that reads a real touch's \`pageX\` gets zero. Without it a handler that reads
   * \`event.nativeEvent\` at all would throw on \`undefined\` (llp/0018-interaction-commands.rfc.md §Must not lose).
   */
  function syntheticEvent(name) {
    var now = Date.now();
    return {
      nativeEvent: {
        locationX: 0, locationY: 0, pageX: 0, pageY: 0,
        identifier: 0, target: null, timestamp: now,
        touches: [], changedTouches: []
      },
      target: null,
      currentTarget: null,
      bubbles: false,
      cancelable: true,
      defaultPrevented: false,
      timeStamp: now,
      type: name,
      preventDefault: function () {},
      stopPropagation: function () {},
      persist: function () {},
      isDefaultPrevented: function () { return false; },
      isPropagationStopped: function () { return false; }
    };
  }

  /** What a caught throw is reported as. The app's own words, so the caller fences them. */
  function describeThrow(err) {
    return {
      text: String(err),
      stack: err && err.stack ? String(err.stack).split('\\n').slice(0, 6).join('\\n') : null
    };
  }

  /**
   * The text one fiber shows, which is its **own** string children joined.
   *
   * A single string child is the easy case and was the only one this read [friction run 7, F63].
   * \`<Text>count: {count}</Text>\` compiles to \`children: ['count: ', count]\` — an array — and
   * every screen that shows a number shows it that way, so a reader of only the string case
   * reported \`text: null\` for the one node a tap had changed and \`--verify\` said "nothing
   * changed" for a tap that worked.
   *
   * Element children are skipped rather than stringified: each is rendered by a fiber of its own
   * that this walk reaches separately, and \`String(child)\` on a React element is
   * \`[object Object]\`. A node whose children are *all* elements has no text of its own, which is
   * null and not the empty string.
   *
   * A \`value\` is read only when there are no text children, because the two never coexist: it is
   * a \`TextInput\`'s committed content. A \`placeholder\` is never text — see {@link placeholderOf}.
   */
  function textOf(f) {
    var p = propsOf(f);
    if (!p) {
      return typeof f.memoizedProps === 'string' ? f.memoizedProps : null;
    }
    var kids = p.children;
    if (typeof kids === 'string') return kids;
    if (typeof kids === 'number') return String(kids);
    if (Array.isArray(kids)) {
      var parts = [];
      var sawText = false;
      for (var i = 0; i < kids.length; i++) {
        if (typeof kids[i] === 'string') { parts.push(kids[i]); sawText = true; }
        else if (typeof kids[i] === 'number') { parts.push(String(kids[i])); sawText = true; }
      }
      if (sawText) return parts.join('');
    }
    return typeof p.value === 'string' ? p.value : null;
  }

  /**
   * What an input shows when it is **empty**, which is not its text [friction run 7, F70].
   *
   * Reported under its own key: as \`text\` it made an empty field indistinguishable from a filled
   * one, so an agent checking "did my typing land" read the placeholder as content.
   */
  function placeholderOf(f) {
    var p = propsOf(f);
    return p && typeof p.placeholder === 'string' ? p.placeholder : null;
  }

  /** One node of the report, as both the tree and the verify snapshot project it. */
  function project(f, depth, screen) {
    var p = propsOf(f);
    var handlers = handlersOf(f);
    var disabled = disabledOn(f);
    return {
      component: nameOf(f),
      testID: testIDOf(f),
      accessibilityLabel: p && typeof p.accessibilityLabel === 'string' ? p.accessibilityLabel : null,
      accessibilityRole:
        p && typeof p.accessibilityRole === 'string'
          ? p.accessibilityRole
          : p && typeof p.role === 'string' ? p.role : null,
      text: textOf(f),
      placeholder: placeholderOf(f),
      handlers: handlers,
      interactive: handlers.length > 0,
      disabled: disabled != null,
      disabledOn: disabled,
      // How many fibers this row stands for: one for a plain fiber, the whole group for an element.
      groupSize: 1,
      host: isHost(f),
      depth: depth,
      screen: screen
    };
  }

  /**
   * One row for one **element**, which is the unit \`runtime:tap\` and \`--testID\` work in.
   *
   * The default listing used to be one row per fiber: nine elements printed 26 rows, three of them
   * for one button, and nothing in the output told "one element over three fibers" from "two real
   * elements needing --index" [friction run 7, F69]. A testID lands on every fiber that forwards
   * props to a host view, and which fiber of that chain carries \`onPress\`, \`disabled\` or the
   * text differs by component — so the row carries the whole group's facts rather than the top
   * fiber's.
   *
   * A fiber with no testID is its own element. It has no group to fold: nothing else in the tree
   * identifies it, and a node with a handler and no testID is only reachable through this listing.
   */
  function projectElement(entry) {
    var node = project(entry.f, entry.d, entry.s);
    var target = node.testID;
    if (target == null) return node;

    var group = groupOf(entry.f, target);
    node.groupSize = group.length;
    var found = [];
    for (var i = 0; i < group.length; i++) {
      var own = handlersOf(group[i].f);
      for (var h = 0; h < own.length; h++) {
        if (found.indexOf(own[h]) < 0) found.push(own[h]);
      }
      // Shallowest first, so the first fiber that has one wins and the order of the group cannot
      // change what the row says.
      if (node.text == null) node.text = textOf(group[i].f);
      if (node.placeholder == null) node.placeholder = placeholderOf(group[i].f);
    }
    // In HANDLER_PROPS order, so two elements with the same handlers report them the same way.
    var handlers = [];
    for (var k = 0; k < HANDLER_PROPS.length; k++) {
      if (found.indexOf(HANDLER_PROPS[k]) >= 0) handlers.push(HANDLER_PROPS[k]);
    }
    node.handlers = handlers;
    node.interactive = handlers.length > 0;
    var disabled = groupDisabledOn(group);
    node.disabled = disabled != null;
    node.disabledOn = disabled ? disabled.on : null;
    return node;
  }

  /**
   * Whether a node belongs in the report.
   *
   * The default is the **interactive projection** — a handler or a testID — because that is what
   * stays a fixed size as the app grows: the full projection of the spike's notes screen was 12 KB
   * and 241 KB with 300 more list rows, while the interactive one went from 3.5 KB to 6.1 KB.
   */
  function keep(node, full) {
    if (node.handlers.length > 0 || node.testID != null) return true;
    if (!full) return false;
    return (
      node.accessibilityLabel != null ||
      node.accessibilityRole != null ||
      (node.host && (node.text != null || node.placeholder != null))
    );
  }
`;

/** How the caller's `testID` and text reach the expression: as data, and only as data. */
function literal(value: string | number | boolean | null): string {
  return JSON.stringify(value);
}

export interface TreeExpressionOptions {
  /** The full projection (`--all`) instead of the interactive one. */
  full: boolean;
  /** The whole tree (`--all-screens`) instead of the focused screen. */
  allScreens: boolean;
  /** Restrict the report to the elements carrying this testID, or null for the whole screen. */
  testID: string | null;
  /** How many nodes to report before truncating. */
  maxNodes: number;
}

/**
 * The `runtime:tree` expression: what is on the screen, and what a tap on it would find.
 *
 * With `testID`, the report is the matched elements' own subtrees plus one summary row each — which
 * is `runtime:tap` without the call, so an agent can look before it drives.
 */
export function buildTreeExpression({
  full,
  allScreens,
  testID,
  maxNodes,
}: TreeExpressionOptions): string {
  return `(function () {${PRELUDE}
  var FULL = ${literal(full)};
  var ALL_SCREENS = ${literal(allScreens)};
  var TARGET = ${literal(testID)};
  var MAX = ${literal(maxNodes)};

  var raw = [];
  walkAll(function (f, d, unfocused, screen) {
    raw.push({ f: f, d: d, u: unfocused, s: screen });
  });

  // A focus filter is only applied when focus was *established*. Where it was not, the honest
  // answer is the whole tree with \`focusedScreen: null\` rather than an error — this reads React
  // Navigation internals, which is a narrower dependency than React's.
  var focusUsable = focusedScreen != null;
  var scoped = ALL_SCREENS || !focusUsable ? raw : raw.filter(function (e) { return !e.u; });

  var nodes = [];
  var matches = [];
  var matched = 0;

  if (TARGET == null) {
    for (var i = 0; i < scoped.length; i++) {
      var entry = scoped[i];
      var id = testIDOf(entry.f);
      // The element's top fiber is the one no ancestor of which carries the same testID — the same
      // match rule \`runtime:tap\` uses, so the two commands cannot disagree about what an element
      // is (F69). Every fiber below it is part of the row that fiber produced.
      if (id != null && insideSameElement(entry.f, id)) continue;
      var node = projectElement(entry);
      if (keep(node, FULL)) nodes.push(node);
    }
  } else {
    var elements = matchElements(TARGET);
    if (!ALL_SCREENS && focusUsable) {
      elements = elements.filter(function (e) { return !e.u; });
    }
    matched = elements.length;
    for (var mi = 0; mi < elements.length; mi++) {
      var element = elements[mi];
      var group = groupOf(element.f, TARGET);
      var disabled = groupDisabledOn(group);
      var handler = null;
      var handlerName = null;
      for (var hi = 0; hi < HANDLER_PROPS.length && !handler; hi++) {
        handler = findHandler(group, HANDLER_PROPS[hi]);
        if (handler) handlerName = HANDLER_PROPS[hi];
      }
      matches.push({
        index: mi,
        component: nameOf(element.f),
        screen: element.s,
        groupSize: group.length,
        handler: handlerName,
        handlerOn: handler ? nameOf(handler.f) : null,
        handlerOutsideMatch: handler ? handler.outside : null,
        disabled: disabled != null,
        disabledOn: disabled ? disabled.on : null
      });
      // The element's own subtree, so "what is inside this button" is answerable in one call. The
      // match itself is always reported, whatever the projection says about it.
      walkSubtree(element.f, function (f, d) {
        var subNode = project(f, element.d + d, element.s);
        if (d === 0 || keep(subNode, FULL)) nodes.push(subNode);
      });
    }
  }

  // Two counts, because one of them was read as the other: \`nodeCount: 42\` beside four returned
  // nodes said "42 kept, and 38 of them are still to come" to a caller who had already been given
  // everything this run would give [friction run 7, F74]. \`nodeCount\` is what came back.
  var total = nodes.length;
  var truncated = total > MAX;
  return {
    supported: true,
    reason: null,
    testID: TARGET,
    focusedScreen: focusUsable ? focusedScreen : null,
    screensSeen: screensSeen,
    allScreens: ALL_SCREENS,
    projection: FULL ? 'full' : 'interactive',
    fibersWalked: raw.length,
    nodeCount: truncated ? MAX : total,
    nodesBeforeTruncation: total,
    truncated: truncated,
    nodes: truncated ? nodes.slice(0, MAX) : nodes,
    matched: matched,
    matches: matches
  };
})()`;
}

/**
 * The snapshot `--verify` compares, which is the **full** projection.
 *
 * The interactive one is the right default for reading a screen and the wrong one for detecting a
 * change: what a tap alters is usually text, and a list row that is only a `Text` carries no
 * handler and no testID. Live against the spike's notes app, an interactive snapshot reported only
 * the input clearing and missed the row the tap had appended [observed — 2026-08-26].
 *
 * The size argument that bounds the default does not apply here, because `--max-nodes` bounds this
 * too and nothing prints the snapshot: only the diff between two of them is reported.
 */
export function buildSnapshotExpression({
  allScreens,
  maxNodes,
}: {
  allScreens: boolean;
  maxNodes: number;
}): string {
  return buildTreeExpression({ full: true, allScreens, testID: null, maxNodes });
}

export interface CallExpressionOptions {
  /** The element to act on. */
  testID: string;
  /** Which of several matched elements, or null when the caller named none. */
  index: number | null;
  /** Act on an element on any screen, not only the focused one. */
  allScreens: boolean;
  /** Call the handler of an element the app reports as disabled. */
  force: boolean;
}

/**
 * The fixed part of a tap or a type: find the element, refuse what should be refused, report.
 *
 * @param prop the handler prop this command calls.
 * @param extraFields report keys the command adds, in the same object literal as the shared ones —
 * so a run that stops at "no match" still answers with the whole key set, which is what lets a
 * caller read one field without checking whether it is there (llp/0006 §Output contract).
 */
function callPrologue(prop: string, extraFields: string = ''): string {
  return `${PRELUDE}
  var TARGET = TESTID;
  var report = {
    supported: true,
    testID: TARGET,
    matched: 0,
    index: null,
    component: null,
    screen: null,
    focusedScreen: null,
    screensSeen: screensSeen,
    allScreens: ALL_SCREENS,
    groupSize: null,
    handler: null,
    handlerOn: null,
    handlerOutsideMatch: null,
    disabled: null,
    disabledOn: null,
    disabledComponent: null,
    forced: FORCE,
    called: false,
    threw: null,
    reason: null,
    candidates: []${extraFields}
  };

  var elements = matchElements(TARGET);
  var focusUsable = focusedScreen != null;
  report.focusedScreen = focusUsable ? focusedScreen : null;
  report.screensSeen = screensSeen;
  if (!ALL_SCREENS && focusUsable) {
    elements = elements.filter(function (e) { return !e.u; });
  }
  report.matched = elements.length;
  // Each candidate's own handler, computed before anything is refused: "two elements carry this
  // testID, pass --index" was the answer for two elements neither of which had the prop this
  // command calls, and --index 0 would have failed for a different reason (F80).
  var candidatesWithHandler = 0;
  for (var ci = 0; ci < elements.length; ci++) {
    var candidateHandler = findHandler(groupOf(elements[ci].f, TARGET), ${JSON.stringify(prop)});
    if (candidateHandler) candidatesWithHandler++;
    report.candidates.push({
      index: ci,
      component: nameOf(elements[ci].f),
      screen: elements[ci].s,
      handler: candidateHandler ? ${JSON.stringify(prop)} : null
    });
  }

  if (elements.length === 0) {
    report.reason = 'no-match';
    return report;
  }
  if (elements.length > 1 && INDEX == null) {
    // Which of the two facts is reported is which of the two the caller has to act on: with no
    // candidate carrying the handler, choosing between them is not the problem.
    report.reason = candidatesWithHandler === 0 ? 'no-handler' : 'ambiguous';
    return report;
  }
  var chosen = INDEX == null ? 0 : INDEX;
  if (chosen < 0 || chosen >= elements.length) {
    report.reason = 'index-out-of-range';
    return report;
  }

  var element = elements[chosen];
  report.index = chosen;
  report.component = nameOf(element.f);
  report.screen = element.s;

  var group = groupOf(element.f, TARGET);
  report.groupSize = group.length;
  var disabled = groupDisabledOn(group);
  report.disabled = disabled != null;
  report.disabledOn = disabled ? disabled.on : null;
  report.disabledComponent = disabled ? disabled.component : null;
  // \`disabled\` does not take the handler off the props: React Native disables the press at the
  // responder level, which this never goes through, so calling it would run the handler of a
  // control the user cannot use — a false pass an agent cannot see (llp/0018-interaction-commands.rfc.md §Must not lose).
  if (disabled != null && !FORCE) {
    report.reason = 'disabled';
    return report;
  }

  var found = findHandler(group, ${JSON.stringify(prop)});
  if (!found) {
    report.reason = 'no-handler';
    return report;
  }
  report.handler = ${JSON.stringify(prop)};
  report.handlerOn = nameOf(found.f);
  report.handlerOutsideMatch = found.outside;
`;
}

/** The `runtime:tap` expression: find the element, then call its `onPress`. */
export function buildTapExpression({
  testID,
  index,
  allScreens,
  force,
}: CallExpressionOptions): string {
  return `(function () {
  var TESTID = ${literal(testID)};
  var INDEX = ${literal(index)};
  var ALL_SCREENS = ${literal(allScreens)};
  var FORCE = ${literal(force)};
${callPrologue('onPress')}
  report.called = true;
  try {
    found.f.memoizedProps.onPress(syntheticEvent('press'));
  } catch (err) {
    report.threw = describeThrow(err);
  }
  return report;
})()`;
}

export interface TypeExpressionOptions extends CallExpressionOptions {
  /** The text to hand to `onChangeText`. */
  text: string;
  /** Call `onSubmitEditing` after the text (`--submit`). */
  submit: boolean;
}

/** The `runtime:type` expression: `onChangeText`, and `onSubmitEditing` when `--submit` says so. */
export function buildTypeExpression({
  testID,
  index,
  allScreens,
  force,
  text,
  submit,
}: TypeExpressionOptions): string {
  return `(function () {
  var TESTID = ${literal(testID)};
  var INDEX = ${literal(index)};
  var ALL_SCREENS = ${literal(allScreens)};
  var FORCE = ${literal(force)};
  var TEXT = ${literal(text)};
  var SUBMIT = ${literal(submit)};
${callPrologue('onChangeText', ',\n    submitted: false,\n    submitHandlerOn: null')}
  report.called = true;
  try {
    found.f.memoizedProps.onChangeText(TEXT);
  } catch (err) {
    report.threw = describeThrow(err);
    return report;
  }
  if (SUBMIT) {
    var submitHandler = findHandler(group, 'onSubmitEditing');
    if (submitHandler) {
      report.submitHandlerOn = nameOf(submitHandler.f);
      try {
        var event = syntheticEvent('submitEditing');
        event.nativeEvent.text = TEXT;
        submitHandler.f.memoizedProps.onSubmitEditing(event);
        report.submitted = true;
      } catch (err2) {
        report.threw = describeThrow(err2);
      }
    } else {
      report.reason = 'no-submit-handler';
    }
  }
  return report;
})()`;
}
