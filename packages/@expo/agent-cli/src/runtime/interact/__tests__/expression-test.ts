// @ref llp/0014-interaction-spike.notes.md §What the implementer must not lose
// The shipped expressions, run against fiber trees built to the shapes the spike recorded.
//
// The trees come from `src/runtime/__tests__/fixtures/spike-view-tree/`: `out-04-match-groups.json`
// records, for each of the four elements on a real screen, which components carried the testID and
// at which fiber depth — including the depth *gaps*, which is the whole of why a group is not a
// contiguous chain. `buildFromChain` turns one of those recorded chains back into a tree, filling
// the gaps with fibers that carry no testID, so a walk that follows only the child pointer stops
// short exactly where it stopped short live.

import fs from 'fs';
import path from 'path';

import {
  buildSnapshotExpression,
  buildTapExpression,
  buildTreeExpression,
  buildTypeExpression,
} from '../expression';
import {
  evaluateExpression,
  installHook,
  installHookWithoutRoots,
  removeHook,
  screen,
  type FiberSpec,
} from './fiberTree';

// The fixtures are files in the repository, and the suite-wide `fs` mock is memfs, which has none
// of them in it.
jest.unmock('fs');
jest.unmock('node:fs');

const FIXTURES = path.resolve(__dirname, '../../__tests__/fixtures/spike-view-tree');

/** One entry of a recorded `chain`: a component that carried the testID, at this fiber depth. */
interface RecordedChainEntry {
  d: number;
  name: string;
}

interface RecordedGroup {
  testID: string;
  topComponent: string;
  chain: RecordedChainEntry[];
  handlerFound: { handler: string; on: string; stepsUp: number; insideGroup: boolean } | null;
}

function recordedGroups(): RecordedGroup[] {
  const fixture = JSON.parse(
    fs.readFileSync(path.join(FIXTURES, 'out-04-match-groups.json'), 'utf8')
  );
  return fixture.result.value.groups as RecordedGroup[];
}

/**
 * Rebuild one recorded group as a fiber tree.
 *
 * The recorded depths are relative to the top of the group, and a depth with no entry is a fiber
 * that does **not** carry the testID — `expo-router`'s `Link` forwards through two of those. Each
 * such gap becomes a `Passthrough` fiber, so the shape is the one that was live.
 *
 * @param handlers handler props to put on named components, e.g. `{ Text: 'onPress' }`.
 * @param extraProps extra props per component name, e.g. `{ Pressable: { disabled: true } }`.
 */
function buildFromChain(
  group: RecordedGroup,
  handlers: Record<string, string[]> = {},
  extraProps: Record<string, Record<string, unknown>> = {}
): FiberSpec {
  const deepest = Math.max(...group.chain.map((entry) => entry.d));
  const byDepth = new Map(group.chain.map((entry) => [entry.d, entry.name]));

  const at = (depth: number): FiberSpec => {
    const name = byDepth.get(depth);
    const props: Record<string, unknown> = name == null ? {} : { testID: group.testID };
    for (const handler of handlers[name ?? ''] ?? []) {
      props[handler] = () => {};
    }
    Object.assign(props, extraProps[name ?? ''] ?? {});
    return {
      name: name ?? `Passthrough${depth}`,
      props,
      children: depth < deepest ? [at(depth + 1)] : [],
    };
  };
  return at(0);
}

let restore: (() => void) | null = null;
afterEach(() => {
  restore?.();
  restore = null;
});

/** Install a hook over one tree and evaluate an expression against it. */
function against<T>(tree: FiberSpec, expression: string): T {
  restore = installHook(tree);
  return evaluateExpression<T>(expression);
}

interface TreeAnswer {
  supported: boolean;
  reason: string | null;
  focusedScreen: string | null;
  screensSeen: string[];
  projection: string;
  nodeCount: number;
  nodesBeforeTruncation: number;
  truncated: boolean;
  nodes: {
    component: string;
    testID: string | null;
    text: string | null;
    placeholder: string | null;
    handlers: string[];
    interactive: boolean;
    disabled: boolean;
    disabledOn: string | null;
    groupSize: number;
    host: boolean;
    accessibilityRole: string | null;
    screen: string | null;
  }[];
  matched: number;
  matches: {
    index: number;
    component: string;
    groupSize: number;
    handler: string | null;
    handlerOn: string | null;
    handlerOutsideMatch: boolean | null;
    disabled: boolean;
    disabledOn: string | null;
  }[];
}

interface CallAnswer {
  supported: boolean;
  testID: string;
  matched: number;
  index: number | null;
  component: string | null;
  screen: string | null;
  focusedScreen: string | null;
  groupSize: number | null;
  handler: string | null;
  handlerOn: string | null;
  handlerOutsideMatch: boolean | null;
  disabled: boolean | null;
  disabledOn: string | null;
  disabledComponent: string | null;
  called: boolean;
  threw: { text: string; stack: string | null } | null;
  reason: string | null;
  candidates: {
    index: number;
    component: string;
    screen: string | null;
    handler: string | null;
  }[];
  submitted?: boolean;
  submitHandlerOn?: string | null;
}

const wholeTree = buildTreeExpression({
  full: true,
  allScreens: true,
  testID: null,
  maxNodes: 500,
});

// @ref llp/0014 §What the implementer must not lose, item 8. The one guard: a runtime with no
// DevTools hook is refused, never answered with part of a tree.
describe('the one guard', () => {
  it(`refuses when the app has no DevTools hook at all`, () => {
    restore = removeHook();
    expect(evaluateExpression<TreeAnswer>(wholeTree)).toEqual({
      supported: false,
      reason: 'no-devtools-hook',
    });
  });

  it(`refuses when the hook is there and carries no getFiberRoots`, () => {
    restore = installHookWithoutRoots();
    expect(evaluateExpression<TreeAnswer>(wholeTree)).toEqual({
      supported: false,
      reason: 'no-get-fiber-roots',
    });
  });

  it(`refuses on every one of the three expressions, not only the tree`, () => {
    restore = removeHook();
    const expressions = [
      wholeTree,
      buildTapExpression({ testID: 'add-note', index: null, allScreens: false, force: false }),
      buildTypeExpression({
        testID: 'note-input',
        index: null,
        allScreens: false,
        force: false,
        text: 'x',
        submit: false,
      }),
    ];
    for (const expression of expressions) {
      expect(evaluateExpression<{ supported: boolean }>(expression).supported).toBe(false);
    }
  });
});

// @ref llp/0014 §What the implementer must not lose, item 2. The load-bearing case, replayed from
// the recording that found it: the first version of the spike's own expression reported
// `handlerFound: null` for a working `expo-router` link.
describe('a group that is not a contiguous chain', () => {
  const link = recordedGroups().find((group) => group.testID === 'home-notes-link')!;

  it(`is the shape the fixture recorded: six fibers with two gaps in the chain`, () => {
    expect(link.chain.map((entry) => entry.d)).toEqual([0, 1, 4, 5, 6, 9]);
    expect(link.handlerFound).toMatchObject({ handler: 'onPress', on: 'Text' });
  });

  it(`finds the handler four levels below the gap`, () => {
    const answer = against<CallAnswer>(
      buildFromChain(link, { Text: ['onPress'] }),
      buildTapExpression({
        testID: 'home-notes-link',
        index: null,
        allScreens: false,
        force: false,
      })
    );

    expect(answer).toMatchObject({
      matched: 1,
      component: 'Link',
      groupSize: 6,
      handler: 'onPress',
      handlerOn: 'Text',
      handlerOutsideMatch: false,
      called: true,
      threw: null,
      reason: null,
    });
  });

  it(`counts one element where the fixture counted six fibers with the testID`, () => {
    const answer = against<TreeAnswer>(
      buildFromChain(link, { Text: ['onPress'] }),
      buildTreeExpression({
        full: false,
        allScreens: true,
        testID: 'home-notes-link',
        maxNodes: 500,
      })
    );

    expect(answer.matched).toBe(1);
    expect(answer.matches[0]).toMatchObject({ groupSize: 6, handlerOn: 'Text' });
  });
});

// @ref llp/0014 §What the implementer must not lose, item 1.
describe('matching by element rather than by fiber', () => {
  it(`reports one match for each testID the fixture wrote once, not one per fiber`, () => {
    const groups = recordedGroups();
    const tree: FiberSpec = {
      name: 'AppRoot',
      props: {},
      children: groups.map((group) => buildFromChain(group, { Pressable: ['onPress'] })),
    };
    restore = installHook(tree);

    // 17 fibers carry a testID in this tree, exactly as they did live, and four elements do. The
    // listing reports the four and accounts for all 17 in their group sizes (F69).
    const all = evaluateExpression<TreeAnswer>(
      buildTreeExpression({ full: false, allScreens: true, testID: null, maxNodes: 500 })
    );
    const carriers = all.nodes.filter((node) => node.testID != null);
    expect(carriers).toHaveLength(4);
    expect(carriers.reduce((sum, node) => sum + node.groupSize, 0)).toBe(17);

    for (const group of groups) {
      const answer = evaluateExpression<CallAnswer>(
        buildTapExpression({
          testID: group.testID,
          index: null,
          allScreens: true,
          force: false,
        })
      );
      expect(answer.matched).toBe(1);
      expect(answer.reason === 'ambiguous').toBe(false);
    }
  });

  it(`asks for --index only when two elements really carry the same testID`, () => {
    const row = (label: string): FiberSpec => ({
      name: 'Pressable',
      props: { testID: 'row', onPress: () => {}, accessibilityLabel: label },
      children: [{ name: 'RCTView', props: { testID: 'row' } }],
    });
    const tree: FiberSpec = { name: 'AppRoot', props: {}, children: [row('a'), row('b')] };

    const ambiguous = against<CallAnswer>(
      tree,
      buildTapExpression({ testID: 'row', index: null, allScreens: true, force: false })
    );
    expect(ambiguous).toMatchObject({ matched: 2, reason: 'ambiguous', called: false });
    expect(ambiguous.candidates).toEqual([
      { index: 0, component: 'Pressable', screen: null, handler: 'onPress' },
      { index: 1, component: 'Pressable', screen: null, handler: 'onPress' },
    ]);

    restore?.();
    const picked = against<CallAnswer>(
      tree,
      buildTapExpression({ testID: 'row', index: 1, allScreens: true, force: false })
    );
    expect(picked).toMatchObject({ matched: 2, index: 1, called: true, reason: null });
  });

  it(`reports an index past the end rather than tapping the first element`, () => {
    const tree: FiberSpec = {
      name: 'Pressable',
      props: { testID: 'only', onPress: () => {} },
    };
    expect(
      against<CallAnswer>(
        tree,
        buildTapExpression({ testID: 'only', index: 4, allScreens: true, force: false })
      )
    ).toMatchObject({ matched: 1, reason: 'index-out-of-range', called: false, index: null });
  });

  it(`reports no match for a testID nothing carries`, () => {
    expect(
      against<CallAnswer>(
        { name: 'AppRoot', props: {} },
        buildTapExpression({ testID: 'nope', index: null, allScreens: true, force: false })
      )
    ).toMatchObject({ matched: 0, reason: 'no-match', called: false });
  });
});

// @ref llp/0014 §What the implementer must not lose, item 3. `RectButton` puts `onPress` on six
// fibers of one group (`out-08-tap-variants.json`), and only the shallowest is the app's own.
describe('the shallowest handler in the group', () => {
  /** The gesture-handler `RectButton` group, as `out-08-tap-variants.json` recorded it. */
  const rectButton: FiberSpec = {
    name: 'RectButtonOuter',
    props: { testID: 'gh-rect', onPress: () => 'app-handler' },
    children: [
      {
        name: 'InnerRectButton',
        props: { testID: 'gh-rect', onPress: () => 'library-1' },
        children: [
          {
            name: 'BaseButtonForwardRef',
            props: { testID: 'gh-rect', onPress: () => 'library-2' },
            children: [
              {
                name: 'RNGestureHandlerButton',
                props: { testID: 'gh-rect', onPress: () => 'library-3' },
                children: [
                  {
                    name: 'RNGestureHandlerButtonNative',
                    host: true,
                    props: { testID: 'gh-rect', onPress: () => 'library-4' },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  it(`calls the outermost of six carriers, which is the prop the app wrote`, () => {
    const answer = against<CallAnswer>(
      rectButton,
      buildTapExpression({ testID: 'gh-rect', index: null, allScreens: true, force: false })
    );

    expect(answer).toMatchObject({
      groupSize: 5,
      handlerOn: 'RectButtonOuter',
      handlerOutsideMatch: false,
      called: true,
      threw: null,
    });
  });

  it(`says so when the handler came from outside the match`, () => {
    // A `Text` inside a card: the tap the agent asked for is on the text, and the handler is the
    // card's. That is what a real touch does, and not what was asked, so the answer names it.
    const card: FiberSpec = {
      name: 'Pressable',
      props: { onPress: () => {} },
      children: [{ name: 'RCTText', props: { testID: 'card-label', children: 'Open' } }],
    };

    expect(
      against<CallAnswer>(
        card,
        buildTapExpression({ testID: 'card-label', index: null, allScreens: true, force: false })
      )
    ).toMatchObject({
      component: 'RCTText',
      handlerOn: 'Pressable',
      handlerOutsideMatch: true,
      called: true,
    });
  });

  it(`reports no handler for the element the fixture recorded without one`, () => {
    const list = recordedGroups().find((group) => group.testID === 'note-list')!;
    expect(list.handlerFound).toBeNull();

    expect(
      against<CallAnswer>(
        buildFromChain(list),
        buildTapExpression({ testID: 'note-list', index: null, allScreens: true, force: false })
      )
    ).toMatchObject({ matched: 1, groupSize: 5, reason: 'no-handler', called: false });
  });
});

// @ref llp/0014 §`disabled` does not remove the handler — the one correctness bug the spike found.
describe('a disabled element', () => {
  const fixture = JSON.parse(
    fs.readFileSync(path.join(FIXTURES, 'out-15-disabled.json'), 'utf8')
  ).result.value.nodes as {
    testID: string;
    component: string;
    hasOnPress: boolean;
    disabledProp: unknown;
    accessibilityState: string | null;
  }[];

  /** The two buttons of `out-15-disabled.json`, rebuilt from what it recorded of each fiber. */
  function buildFrom(testID: string): FiberSpec {
    const recorded = fixture.filter((node) => node.testID === testID);
    const spec = (index: number): FiberSpec => {
      const node = recorded[index]!;
      const props: Record<string, unknown> = { testID };
      if (node.hasOnPress) {
        props.onPress = () => {};
      }
      if (node.disabledProp === true) {
        props.disabled = true;
      }
      if (node.accessibilityState != null) {
        props.accessibilityState = JSON.parse(node.accessibilityState);
      }
      return {
        name: node.component,
        props,
        children: index + 1 < recorded.length ? [spec(index + 1)] : [],
      };
    };
    return spec(0);
  }

  it(`is the shape the fixture recorded: onPress present alongside disabled`, () => {
    const disabled = fixture.filter((node) => node.testID === 'disabled-btn');
    expect(disabled[0]).toMatchObject({ component: 'Pressable', hasOnPress: true, disabledProp: true });
    expect(disabled[1]!.accessibilityState).toBe('{"disabled":true}');
  });

  it(`is refused rather than tapped`, () => {
    expect(
      against<CallAnswer>(
        buildFrom('disabled-btn'),
        buildTapExpression({
          testID: 'disabled-btn',
          index: null,
          allScreens: true,
          force: false,
        })
      )
    ).toMatchObject({
      matched: 1,
      disabled: true,
      disabledOn: 'disabled',
      disabledComponent: 'Pressable',
      reason: 'disabled',
      called: false,
    });
  });

  it(`is tapped when --force says so, and still reported as disabled`, () => {
    expect(
      against<CallAnswer>(
        buildFrom('disabled-btn'),
        buildTapExpression({ testID: 'disabled-btn', index: null, allScreens: true, force: true })
      )
    ).toMatchObject({ disabled: true, disabledOn: 'disabled', called: true, reason: null });
  });

  it(`leaves the enabled button beside it alone`, () => {
    expect(
      against<CallAnswer>(
        buildFrom('add-note'),
        buildTapExpression({ testID: 'add-note', index: null, allScreens: true, force: false })
      )
    ).toMatchObject({ disabled: false, disabledOn: null, called: true, reason: null });
  });

  it(`is recognised from accessibilityState on a fiber below the match`, () => {
    const tree: FiberSpec = {
      name: 'CustomButton',
      props: { testID: 'custom', onPress: () => {} },
      children: [
        {
          name: 'RCTView',
          props: { testID: 'custom', accessibilityState: { disabled: true } },
        },
      ],
    };
    expect(
      against<CallAnswer>(
        tree,
        buildTapExpression({ testID: 'custom', index: null, allScreens: true, force: false })
      )
    ).toMatchObject({
      disabled: true,
      disabledOn: 'accessibilityState.disabled',
      disabledComponent: 'RCTView',
      reason: 'disabled',
    });
  });
});

// @ref llp/0014 §What the walk sees that the user cannot. Three screens are mounted at once, and a
// tree that reports all of them says the app shows all of them.
describe('the focus filter', () => {
  const fixture = JSON.parse(
    fs.readFileSync(path.join(FIXTURES, 'out-14-screen-focus.json'), 'utf8')
  ).result.value.nodes as { name: string; scalarProps: Record<string, unknown> }[];

  /** The three tabs of `out-14-screen-focus.json`, each with one button on it. */
  function tabs(): FiberSpec {
    const recorded = fixture.filter((node) => node.name === 'Screen');
    return {
      name: 'RNSTabsHostIOS',
      props: {},
      children: recorded.map((node) =>
        screen(String(node.scalarProps.name), node.scalarProps.isFocused === true, [
          {
            name: 'Pressable',
            props: { testID: `${node.scalarProps.name}-button`, onPress: () => {} },
          },
        ])
      ),
    };
  }

  it(`is the shape the fixture recorded: three Screens, one focused`, () => {
    const recorded = fixture.filter((node) => node.name === 'Screen');
    expect(recorded.map((node) => node.scalarProps)).toEqual([
      { isFocused: false, name: 'index', routeKey: 'index-0rdCLEmcFeHIj-D-YOWuy' },
      { isFocused: false, name: 'explore', routeKey: 'explore-DbbNx4vcBV76Gur9ayT4X' },
      { isFocused: true, name: 'notes', routeKey: 'notes-uwRaOpCYt9X7npvD894oL' },
    ]);
  });

  it(`reports the focused screen only, and names every screen it saw`, () => {
    const answer = against<TreeAnswer>(
      tabs(),
      buildTreeExpression({ full: false, allScreens: false, testID: null, maxNodes: 500 })
    );

    expect(answer.focusedScreen).toBe('notes');
    expect(answer.screensSeen).toEqual(['index', 'explore', 'notes']);
    expect(answer.nodes.map((node) => node.testID)).toEqual(['notes-button']);
  });

  it(`reports the whole tree under --all-screens`, () => {
    const answer = against<TreeAnswer>(
      tabs(),
      buildTreeExpression({ full: false, allScreens: true, testID: null, maxNodes: 500 })
    );

    expect(answer.nodes.map((node) => node.testID)).toEqual([
      'index-button',
      'explore-button',
      'notes-button',
    ]);
  });

  it(`refuses to tap a button on a screen that is not on screen`, () => {
    expect(
      against<CallAnswer>(
        tabs(),
        buildTapExpression({
          testID: 'index-button',
          index: null,
          allScreens: false,
          force: false,
        })
      )
    ).toMatchObject({ matched: 0, reason: 'no-match', focusedScreen: 'notes' });
  });

  it(`taps it when --all-screens says the whole tree is in scope`, () => {
    expect(
      against<CallAnswer>(
        tabs(),
        buildTapExpression({ testID: 'index-button', index: null, allScreens: true, force: false })
      )
    ).toMatchObject({ matched: 1, screen: 'index', called: true, reason: null });
  });

  // A nested navigator has two focused `Screen` fibers, one inside the other. Nothing has to choose
  // between them: a node is off the focused screen when any `Screen` ancestor of it is unfocused.
  it(`follows a focused screen inside a focused screen`, () => {
    const nested: FiberSpec = {
      name: 'Root',
      props: {},
      children: [
        screen('tab-a', true, [
          screen('detail', true, [
            { name: 'Pressable', props: { testID: 'deep', onPress: () => {} } },
          ]),
          screen('list', false, [
            { name: 'Pressable', props: { testID: 'behind', onPress: () => {} } },
          ]),
        ]),
        screen('tab-b', false, [
          screen('other', true, [
            { name: 'Pressable', props: { testID: 'other-tab', onPress: () => {} } },
          ]),
        ]),
      ],
    };

    const answer = against<TreeAnswer>(
      nested,
      buildTreeExpression({ full: false, allScreens: false, testID: null, maxNodes: 500 })
    );

    expect(answer.focusedScreen).toBe('detail');
    expect(answer.nodes.map((node) => node.testID)).toEqual(['deep']);
  });

  // Focus is read out of a React Navigation internal, so the failure has to be "here is everything,
  // I could not tell" rather than an error or an empty tree (llp/0014 §Recommendation).
  it(`reports everything with a null focused screen when no Screen fiber says anything`, () => {
    const plain: FiberSpec = {
      name: 'Root',
      props: {},
      children: [
        { name: 'Pressable', props: { testID: 'a', onPress: () => {} } },
        { name: 'Pressable', props: { testID: 'b', onPress: () => {} } },
      ],
    };

    const answer = against<TreeAnswer>(
      plain,
      buildTreeExpression({ full: false, allScreens: false, testID: null, maxNodes: 500 })
    );

    expect(answer.focusedScreen).toBeNull();
    expect(answer.screensSeen).toEqual([]);
    expect(answer.nodes.map((node) => node.testID)).toEqual(['a', 'b']);
  });

  it(`reports everything when Screen fibers exist and none of them is focused`, () => {
    const noneFocused: FiberSpec = {
      name: 'Root',
      props: {},
      children: [
        screen('one', false, [{ name: 'Pressable', props: { testID: 'a', onPress: () => {} } }]),
        screen('two', false, [{ name: 'Pressable', props: { testID: 'b', onPress: () => {} } }]),
      ],
    };

    const answer = against<TreeAnswer>(
      noneFocused,
      buildTreeExpression({ full: false, allScreens: false, testID: null, maxNodes: 500 })
    );

    expect(answer.focusedScreen).toBeNull();
    expect(answer.screensSeen).toEqual(['one', 'two']);
    expect(answer.nodes.map((node) => node.testID)).toEqual(['a', 'b']);
  });
});

// @ref llp/0014 §What the implementer must not lose, item 6. The default is bounded by what it
// keeps, not by a fiber depth: fiber depth on the spike's app was 152, and every visible element
// sat between 128 and 152.
describe('the projections', () => {
  const mixed: FiberSpec = {
    name: 'Root',
    props: {},
    children: [
      { name: 'Pressable', props: { testID: 'button', onPress: () => {} } },
      { name: 'RCTText', props: { children: 'Just some text' } },
      { name: 'View', props: { accessibilityRole: 'header' } },
      { name: 'View', props: { accessibilityLabel: 'A label' } },
      { name: 'View', props: {} },
    ],
  };

  it(`keeps only handlers and testIDs by default`, () => {
    const answer = against<TreeAnswer>(
      mixed,
      buildTreeExpression({ full: false, allScreens: true, testID: null, maxNodes: 500 })
    );

    expect(answer.projection).toBe('interactive');
    expect(answer.nodes).toHaveLength(1);
    expect(answer.nodes[0]).toMatchObject({ testID: 'button', interactive: true, handlers: ['onPress'] });
  });

  it(`keeps labels, roles and host text under --all`, () => {
    const answer = against<TreeAnswer>(
      mixed,
      buildTreeExpression({ full: true, allScreens: true, testID: null, maxNodes: 500 })
    );

    expect(answer.projection).toBe('full');
    expect(answer.nodes.map((node) => node.component)).toEqual([
      'Pressable',
      'RCTText',
      'View',
      'View',
    ]);
  });

  // @ref llp/0018 §Truncation counts — friction run 7, F74. `nodeCount: 42` beside four returned
  // nodes read as "42 kept, handle the other 38", which is truncation the caller had already been
  // given. The two counts are two fields.
  it(`truncates at --max-nodes and reports the returned count and the total separately`, () => {
    const many: FiberSpec = {
      name: 'Root',
      props: {},
      children: Array.from({ length: 10 }, (_, index) => ({
        name: 'Pressable',
        props: { testID: `row-${index}`, onPress: () => {} },
      })),
    };

    const answer = against<TreeAnswer>(
      many,
      buildTreeExpression({ full: false, allScreens: true, testID: null, maxNodes: 4 })
    );

    expect(answer.truncated).toBe(true);
    expect(answer.nodeCount).toBe(4);
    expect(answer.nodesBeforeTruncation).toBe(10);
    expect(answer.nodes).toHaveLength(4);
  });

  it(`reports the same two counts when nothing was cut`, () => {
    const answer = against<TreeAnswer>(
      { name: 'Pressable', props: { testID: 'only', onPress: () => {} } },
      buildTreeExpression({ full: false, allScreens: true, testID: null, maxNodes: 4 })
    );

    expect(answer).toMatchObject({ truncated: false, nodeCount: 1, nodesBeforeTruncation: 1 });
  });

  it(`reports the subtree of a named testID, whatever the projection would keep`, () => {
    const card: FiberSpec = {
      name: 'Pressable',
      props: { testID: 'card', onPress: () => {} },
      children: [
        { name: 'RCTText', props: { children: 'Title' } },
        { name: 'View', props: {} },
      ],
    };

    const answer = against<TreeAnswer>(
      card,
      buildTreeExpression({ full: true, allScreens: true, testID: 'card', maxNodes: 500 })
    );

    expect(answer.matched).toBe(1);
    expect(answer.nodes.map((node) => node.component)).toEqual(['Pressable', 'RCTText']);
    expect(answer.matches[0]).toMatchObject({
      component: 'Pressable',
      handler: 'onPress',
      handlerOn: 'Pressable',
      disabled: false,
    });
  });

  it(`reports no match for a testID the screen does not carry`, () => {
    const answer = against<TreeAnswer>(
      { name: 'Root', props: {} },
      buildTreeExpression({ full: false, allScreens: true, testID: 'nope', maxNodes: 500 })
    );

    expect(answer.matched).toBe(0);
    expect(answer.nodes).toEqual([]);
    expect(answer.matches).toEqual([]);
  });

  // The interactive projection is the right default for reading a screen and the wrong one for
  // detecting a change: what a tap alters is usually text, and a list row that is only a `Text`
  // carries no handler and no testID [observed — live against the notes app, 2026-08-26].
  it(`snapshots the full projection for --verify, not the interactive one`, () => {
    expect(buildSnapshotExpression({ allScreens: false, maxNodes: 200 })).toBe(
      buildTreeExpression({ full: true, allScreens: false, testID: null, maxNodes: 200 })
    );
  });

  it(`sees a text row a tap appended, which the interactive projection would miss`, () => {
    const withRow: FiberSpec = {
      name: 'Root',
      props: {},
      children: [
        { name: 'TextInput', props: { testID: 'note-input', onChangeText: () => {}, value: '' } },
        { name: 'RCTText', props: { children: 'a new note' } },
      ],
    };

    const answer = against<TreeAnswer>(
      withRow,
      buildSnapshotExpression({ allScreens: true, maxNodes: 200 })
    );

    expect(answer.nodes.map((node) => node.text)).toEqual(['', 'a new note']);
  });
});

// @ref llp/0018 §The text of a node — friction run 7, F63.
//
// `<Text>count: {count}</Text>` compiles to `children: ['count: ', 1]`, and a reader of only
// `typeof children === 'string'` sees nothing there. The spike recorded the shape live: three
// `#text` fibers at depth 137 of `out-03-tree-walk.json` carry "This starter app includes example",
// "\n" and "code to help you get started.", and their `RCTText` parent at depth 136 is absent from
// the recorded projection — because its own `text` came out null.
describe('the text of a node', () => {
  /** The `#text` runs the fixture recorded under one absent parent, in order. */
  function recordedTextRun(): string[] {
    const kept = JSON.parse(fs.readFileSync(path.join(FIXTURES, 'out-03-tree-walk.json'), 'utf8'))
      .result.value.kept as { component: string; text: string | null; depth: number }[];
    const start = kept.findIndex((node) => node.text === 'This starter app includes example');
    return kept.slice(start, start + 3).map((node) => node.text!);
  }

  it(`is the shape the fixture recorded: three text runs whose parent kept no text`, () => {
    expect(recordedTextRun()).toEqual([
      'This starter app includes example',
      '\n',
      'code to help you get started.',
    ]);
  });

  it(`joins the string children the fixture recorded as separate runs`, () => {
    const runs = recordedTextRun();
    const answer = against<TreeAnswer>(
      {
        name: 'RCTText',
        host: true,
        props: { testID: 'blurb', children: runs },
      },
      buildTreeExpression({ full: true, allScreens: true, testID: null, maxNodes: 500 })
    );

    expect(answer.nodes[0]!.text).toBe(runs.join(''));
  });

  it(`reads an interpolated number, which is the most common change on a screen`, () => {
    const answer = against<TreeAnswer>(
      {
        name: 'Root',
        props: {},
        children: [
          { name: 'Text', props: { testID: 'counter-label', children: ['count: ', 7] } },
          { name: 'Text', props: { testID: 'counter-str', children: 'count is 7' } },
        ],
      },
      buildTreeExpression({ full: true, allScreens: true, testID: null, maxNodes: 500 })
    );

    expect(answer.nodes.map((node) => [node.testID, node.text])).toEqual([
      ['counter-label', 'count: 7'],
      ['counter-str', 'count is 7'],
    ]);
  });

  it(`skips element children rather than stringifying them`, () => {
    const answer = against<TreeAnswer>(
      {
        name: 'Text',
        props: {
          testID: 'mixed',
          children: ['press ', { type: 'Text', props: { children: 'here' } }, ' now'],
        },
      },
      buildTreeExpression({ full: true, allScreens: true, testID: null, maxNodes: 500 })
    );

    expect(answer.nodes[0]!.text).toBe('press  now');
  });

  it(`is null for a node whose children are all elements`, () => {
    const answer = against<TreeAnswer>(
      {
        name: 'View',
        props: { testID: 'wrapper', children: [{ type: 'Text' }, { type: 'Text' }] },
      },
      buildTreeExpression({ full: true, allScreens: true, testID: null, maxNodes: 500 })
    );

    expect(answer.nodes[0]!.text).toBeNull();
  });

  // @ref llp/0018 §The text of a node — friction run 7, F70. A placeholder is what the input says
  // when it is *empty*, so reporting it as `text` makes an empty field indistinguishable from a
  // filled one.
  it(`reports a placeholder as a placeholder and never as text`, () => {
    const answer = against<TreeAnswer>(
      {
        name: 'Root',
        props: {},
        children: [
          {
            name: 'TextInput',
            props: { testID: 'empty-input', placeholder: 'no submit handler', onChangeText: () => {} },
          },
          {
            name: 'TextInput',
            props: { testID: 'filled-input', value: 'cannot change', onChangeText: () => {} },
          },
        ],
      },
      buildTreeExpression({ full: true, allScreens: true, testID: null, maxNodes: 500 })
    );

    expect(answer.nodes.map((node) => [node.testID, node.text, node.placeholder])).toEqual([
      ['empty-input', null, 'no submit handler'],
      ['filled-input', 'cannot change', null],
    ]);
  });

  it(`reports a committed empty value as empty rather than as the placeholder`, () => {
    const answer = against<TreeAnswer>(
      {
        name: 'TextInput',
        props: { testID: 'cleared', value: '', placeholder: 'type here', onChangeText: () => {} },
      },
      buildTreeExpression({ full: true, allScreens: true, testID: null, maxNodes: 500 })
    );

    expect(answer.nodes[0]).toMatchObject({ text: '', placeholder: 'type here' });
  });
});

// @ref llp/0018 §The default listing is elements — friction run 7, F69.
//
// The default listing was one row per fiber: nine elements printed 26 rows, `--index` was
// unguessable from it, and nothing said a button was disabled. It is now the unit `runtime:tap`
// and `--testID` already work in.
describe('the default listing groups by element', () => {
  /** The friction-run-7 lab screen: one button over three fibers, two real duplicates, a Text. */
  const lab: FiberSpec = {
    name: 'Root',
    props: {},
    children: [
      {
        name: 'Pressable',
        props: { testID: 'inc-btn', onPress: () => {} },
        children: [
          {
            name: 'View',
            props: { testID: 'inc-btn' },
            children: [{ name: 'RCTView', props: { testID: 'inc-btn' } }],
          },
        ],
      },
      {
        name: 'Pressable',
        props: { testID: 'disabled-btn', onPress: () => {}, disabled: true },
        children: [
          {
            name: 'RCTView',
            props: { testID: 'disabled-btn', accessibilityState: { disabled: true } },
          },
        ],
      },
      {
        name: 'Pressable',
        props: { testID: 'dup-btn', onPress: () => {} },
        children: [{ name: 'RCTView', props: { testID: 'dup-btn' } }],
      },
      {
        name: 'Pressable',
        props: { testID: 'dup-btn', onPress: () => {} },
        children: [{ name: 'RCTView', props: { testID: 'dup-btn' } }],
      },
      { name: 'Text', props: { testID: 'plain-text', children: 'no handler here' } },
    ],
  };

  it(`prints one row per element, not one per fiber`, () => {
    const answer = against<TreeAnswer>(
      lab,
      buildTreeExpression({ full: false, allScreens: true, testID: null, maxNodes: 500 })
    );

    expect(answer.nodes.map((node) => [node.testID, node.component, node.groupSize])).toEqual([
      ['inc-btn', 'Pressable', 3],
      ['disabled-btn', 'Pressable', 2],
      ['dup-btn', 'Pressable', 2],
      ['dup-btn', 'Pressable', 2],
      ['plain-text', 'Text', 1],
    ]);
    expect(answer.nodeCount).toBe(5);
  });

  it(`marks the element the app reports as disabled, which a tap would refuse`, () => {
    const answer = against<TreeAnswer>(
      lab,
      buildTreeExpression({ full: false, allScreens: true, testID: null, maxNodes: 500 })
    );

    const disabled = answer.nodes.find((node) => node.testID === 'disabled-btn')!;
    expect(disabled).toMatchObject({ disabled: true, disabledOn: 'disabled' });
    expect(answer.nodes.filter((node) => node.disabled)).toHaveLength(1);
  });

  it(`agrees with runtime:tap about what one element is`, () => {
    const listing = against<TreeAnswer>(
      lab,
      buildTreeExpression({ full: false, allScreens: true, testID: null, maxNodes: 500 })
    );
    restore?.();
    const tapped = against<CallAnswer>(
      lab,
      buildTapExpression({ testID: 'dup-btn', index: null, allScreens: true, force: false })
    );

    expect(listing.nodes.filter((node) => node.testID === 'dup-btn')).toHaveLength(tapped.matched);
    expect(tapped.reason).toBe('ambiguous');
  });

  it(`reports the handlers of the whole element, wherever in the group they sit`, () => {
    const answer = against<TreeAnswer>(
      {
        name: 'CustomButton',
        props: { testID: 'deep', onLongPress: () => {} },
        children: [{ name: 'RCTView', props: { testID: 'deep', onPress: () => {} } }],
      },
      buildTreeExpression({ full: false, allScreens: true, testID: null, maxNodes: 500 })
    );

    expect(answer.nodes).toHaveLength(1);
    expect(answer.nodes[0]!.handlers).toEqual(['onPress', 'onLongPress']);
  });

  it(`keeps a node that carries a handler and no testID, as its own element`, () => {
    const answer = against<TreeAnswer>(
      {
        name: 'Root',
        props: {},
        children: [{ name: 'Pressable', props: { onPress: () => {} } }],
      },
      buildTreeExpression({ full: false, allScreens: true, testID: null, maxNodes: 500 })
    );

    expect(answer.nodes).toMatchObject([{ component: 'Pressable', testID: null, groupSize: 1 }]);
  });

  // The `--verify` snapshot is the same walk, so the diff inherits the grouping: `counter-str` and
  // `counter-str#1` were one change listed twice (F69).
  it(`carries the grouping into the --verify snapshot`, () => {
    const answer = against<TreeAnswer>(
      {
        name: 'Text',
        props: { testID: 'counter-str', children: ['count is ', 8] },
        children: [
          {
            name: 'RCTText',
            props: { testID: 'counter-str', children: ['count is ', 8] },
            children: [{ name: '#text', props: 'count is 8' }],
          },
        ],
      },
      buildSnapshotExpression({ allScreens: true, maxNodes: 200 })
    );

    expect(answer.nodes.map((node) => [node.testID, node.text])).toEqual([
      ['counter-str', 'count is 8'],
    ]);
  });
});

// @ref llp/0014 §What the implementer must not lose, item 4. React's numeric fiber tags are
// renumbered between versions, so a host component is recognised by its element type being a
// string and by nothing else.
describe('host detection without fiber tags', () => {
  it(`puts no React tag number in any of the three expressions`, () => {
    const expressions = [
      wholeTree,
      buildTapExpression({ testID: 'a', index: null, allScreens: false, force: false }),
      buildTypeExpression({
        testID: 'a',
        index: null,
        allScreens: false,
        force: false,
        text: 'x',
        submit: true,
      }),
    ];
    for (const expression of expressions) {
      expect(expression).not.toMatch(/\.tag\b/);
      expect(expression).toContain(`typeof typeOf(f) === 'string'`);
    }
  });

  it(`calls a fiber a host component when its element type is a string`, () => {
    const answer = against<TreeAnswer>(
      // Two elements rather than one over two fibers, so both rows are in the listing: the point
      // here is which of them is called a host component, not how they are grouped.
      {
        name: 'Pressable',
        props: { testID: 'button', onPress: () => {} },
        children: [{ name: 'RCTView', props: { testID: 'button-view' } }],
      },
      buildTreeExpression({ full: false, allScreens: true, testID: null, maxNodes: 500 })
    );

    expect(answer.nodes.map((node) => [node.component, node.host])).toEqual([
      ['Pressable', false],
      ['RCTView', true],
    ]);
  });
});

describe('the tap call', () => {
  it(`hands the handler an event shaped like a GestureResponderEvent`, () => {
    let seen: any;
    const tree: FiberSpec = {
      name: 'Pressable',
      props: {
        testID: 'button',
        onPress: (event: unknown) => {
          seen = event;
        },
      },
    };

    against<CallAnswer>(
      tree,
      buildTapExpression({ testID: 'button', index: null, allScreens: true, force: false })
    );

    expect(seen.nativeEvent).toMatchObject({ pageX: 0, pageY: 0, touches: [], changedTouches: [] });
    expect(typeof seen.preventDefault).toBe('function');
    expect(typeof seen.stopPropagation).toBe('function');
    expect(typeof seen.persist).toBe('function');
  });

  it(`reports a handler that threw, and says the tap was made`, () => {
    const tree: FiberSpec = {
      name: 'Pressable',
      props: {
        testID: 'button',
        onPress: () => {
          throw new Error('handler blew up');
        },
      },
    };

    const answer = against<CallAnswer>(
      tree,
      buildTapExpression({ testID: 'button', index: null, allScreens: true, force: false })
    );

    expect(answer.called).toBe(true);
    expect(answer.threw?.text).toContain('handler blew up');
  });
});

describe('the type call', () => {
  /** The `TextInput` group of `out-04-match-groups.json`: three fibers, one shared function. */
  function textInput(record: { text: string[]; submits: string[] }): FiberSpec {
    const onChangeText = (value: string) => record.text.push(value);
    const onSubmitEditing = (event: { nativeEvent?: { text?: string } }) =>
      record.submits.push(event?.nativeEvent?.text ?? '');
    return {
      name: 'TextInput',
      props: { testID: 'note-input', onChangeText, onSubmitEditing },
      children: [
        {
          name: 'InternalTextInput',
          props: { testID: 'note-input', onChangeText, onSubmitEditing },
          children: [
            {
              name: 'RCTSinglelineTextInputView',
              host: true,
              props: { testID: 'note-input', onChangeText, onSubmitEditing },
            },
          ],
        },
      ],
    };
  }

  it(`calls onChangeText once, on the shallowest fiber of the group`, () => {
    const record = { text: [] as string[], submits: [] as string[] };
    const answer = against<CallAnswer>(
      textInput(record),
      buildTypeExpression({
        testID: 'note-input',
        index: null,
        allScreens: true,
        force: false,
        text: 'spike-typed-note',
        submit: false,
      })
    );

    expect(record.text).toEqual(['spike-typed-note']);
    expect(record.submits).toEqual([]);
    expect(answer).toMatchObject({
      handler: 'onChangeText',
      handlerOn: 'TextInput',
      groupSize: 3,
      called: true,
      submitted: false,
      submitHandlerOn: null,
      reason: null,
    });
  });

  it(`calls onSubmitEditing after the text under --submit, with the text on the event`, () => {
    const record = { text: [] as string[], submits: [] as string[] };
    const answer = against<CallAnswer>(
      textInput(record),
      buildTypeExpression({
        testID: 'note-input',
        index: null,
        allScreens: true,
        force: false,
        text: 'hello',
        submit: true,
      })
    );

    expect(record.text).toEqual(['hello']);
    expect(record.submits).toEqual(['hello']);
    expect(answer).toMatchObject({ submitted: true, submitHandlerOn: 'TextInput' });
  });

  it(`says so when --submit found no onSubmitEditing to call`, () => {
    const record: string[] = [];
    const answer = against<CallAnswer>(
      {
        name: 'TextInput',
        props: { testID: 'note-input', onChangeText: (value: string) => record.push(value) },
      },
      buildTypeExpression({
        testID: 'note-input',
        index: null,
        allScreens: true,
        force: false,
        text: 'hello',
        submit: true,
      })
    );

    expect(record).toEqual(['hello']);
    expect(answer).toMatchObject({ called: true, submitted: false, reason: 'no-submit-handler' });
  });

  // The same false pass the disabled tap was, on the prop a TextInput uses for it.
  it(`refuses an input the app marked not editable, unless --force`, () => {
    const notEditable: FiberSpec = {
      name: 'TextInput',
      props: { testID: 'note-input', onChangeText: () => {}, editable: false },
    };

    expect(
      against<CallAnswer>(
        notEditable,
        buildTypeExpression({
          testID: 'note-input',
          index: null,
          allScreens: true,
          force: false,
          text: 'x',
          submit: false,
        })
      )
    ).toMatchObject({ disabled: true, disabledOn: 'editable', reason: 'disabled', called: false });

    restore?.();
    expect(
      against<CallAnswer>(
        notEditable,
        buildTypeExpression({
          testID: 'note-input',
          index: null,
          allScreens: true,
          force: true,
          text: 'x',
          submit: false,
        })
      )
    ).toMatchObject({ disabled: true, called: true, reason: null });
  });

  // @ref llp/0018 §Ambiguity and the handler — friction run 7, F80. Two `shared-id` Pressables,
  // neither of them an input: the answer was the ambiguity, so an agent was sent to `--index 0`,
  // which would have failed for a different reason.
  it(`answers "no candidate takes text" before it answers "which one"`, () => {
    const shared = (screenName: string): FiberSpec =>
      screen(screenName, true, [
        { name: 'Pressable', props: { testID: 'shared-id', onPress: () => {} } },
      ]);
    const answer = against<CallAnswer>(
      { name: 'Root', props: {}, children: [shared('lab'), shared('lab2')] },
      buildTypeExpression({
        testID: 'shared-id',
        index: null,
        allScreens: true,
        force: false,
        text: 'abc',
        submit: false,
      })
    );

    expect(answer).toMatchObject({ matched: 2, reason: 'no-handler', called: false });
    expect(answer.candidates.map((candidate) => candidate.handler)).toEqual([null, null]);
  });

  it(`still asks which one when the candidates do take text`, () => {
    const input = (screenName: string): FiberSpec =>
      screen(screenName, true, [
        { name: 'TextInput', props: { testID: 'shared-input', onChangeText: () => {} } },
      ]);
    const answer = against<CallAnswer>(
      { name: 'Root', props: {}, children: [input('lab'), input('lab2')] },
      buildTypeExpression({
        testID: 'shared-input',
        index: null,
        allScreens: true,
        force: false,
        text: 'abc',
        submit: false,
      })
    );

    expect(answer).toMatchObject({ matched: 2, reason: 'ambiguous', called: false });
    expect(answer.candidates.map((candidate) => candidate.handler)).toEqual([
      'onChangeText',
      'onChangeText',
    ]);
  });

  it(`asks which one when only some of the candidates take text`, () => {
    const answer = against<CallAnswer>(
      {
        name: 'Root',
        props: {},
        children: [
          { name: 'Pressable', props: { testID: 'mixed', onPress: () => {} } },
          { name: 'TextInput', props: { testID: 'mixed', onChangeText: () => {} } },
        ],
      },
      buildTypeExpression({
        testID: 'mixed',
        index: null,
        allScreens: true,
        force: false,
        text: 'abc',
        submit: false,
      })
    );

    expect(answer).toMatchObject({ matched: 2, reason: 'ambiguous' });
    expect(answer.candidates.map((candidate) => candidate.handler)).toEqual([null, 'onChangeText']);
  });

  it(`reports no handler for an element that takes no text`, () => {
    expect(
      against<CallAnswer>(
        { name: 'Pressable', props: { testID: 'button', onPress: () => {} } },
        buildTypeExpression({
          testID: 'button',
          index: null,
          allScreens: true,
          force: false,
          text: 'x',
          submit: false,
        })
      )
    ).toMatchObject({ reason: 'no-handler', called: false, handler: null });
  });
});

describe('the caller input that reaches the app', () => {
  it(`carries a testID with quotes in it as data`, () => {
    const awkward = `it's "quoted" \\ and \n newlined`;
    const tree: FiberSpec = { name: 'Pressable', props: { testID: awkward, onPress: () => {} } };

    expect(
      against<CallAnswer>(
        tree,
        buildTapExpression({ testID: awkward, index: null, allScreens: true, force: false })
      )
    ).toMatchObject({ matched: 1, called: true, testID: awkward });
  });

  it(`types text that would end the expression if it were not escaped`, () => {
    const record: string[] = [];
    const hostile = `'); globalThis.__agentCliPwned = true; ('`;

    against<CallAnswer>(
      {
        name: 'TextInput',
        props: { testID: 'input', onChangeText: (value: string) => record.push(value) },
      },
      buildTypeExpression({
        testID: 'input',
        index: null,
        allScreens: true,
        force: false,
        text: hostile,
        submit: false,
      })
    );

    expect(record).toEqual([hostile]);
    expect((globalThis as Record<string, unknown>).__agentCliPwned).toBeUndefined();
  });
});
