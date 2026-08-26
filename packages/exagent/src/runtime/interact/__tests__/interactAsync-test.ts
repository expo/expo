// @ref llp/0014-interaction-spike.notes.md
// @ref llp/0010-agent-conventions.rfc.md §Exit codes
// The command layer: one evaluate per question, the exit code that follows from the answer, and the
// refusal for a runtime that has no fiber tree to walk.

import { EXIT_OUTCOME_FAILED, EXIT_OK } from '../../../exitCodes';
import { CommandError } from '../../../utils/errors';
import { CdpClient, CdpRequestError, RPC_METHOD_NOT_FOUND } from '../../cdpClient';
import { DEFAULT_MAX_NODES } from '../resolveOptions';
import { runtimeTapAsync, runtimeTreeAsync, runtimeTypeAsync, VERIFY_SETTLE_MS } from '../interactAsync';

jest.mock('../../cdpClient', () => ({
  ...jest.requireActual('../../cdpClient'),
  CdpClient: jest.fn(),
}));

const devServerUrl = 'http://127.0.0.1:8081';
const TARGET = { id: '1', appId: 'host.exp.Exponent', webSocketDebuggerUrl: 'ws://debugger' };

let originalFetch: typeof fetch | undefined;

/** Answer `GET /json/list` with one connected app. */
function mockDevServer(): void {
  globalThis.fetch = (async () => ({ ok: true, json: async () => [TARGET] })) as unknown as typeof fetch;
}

/** Answer every `Runtime.evaluate` with the next value in the queue. */
function mockEvaluate(...values: unknown[]) {
  const evaluateAsync = jest.fn(async (_expression: string) => {
    const value = values.length > 1 ? values.shift() : values[0];
    return { value, type: 'object' };
  });
  jest.mocked(CdpClient).mockImplementation(() => ({ evaluateAsync }) as any);
  return evaluateAsync;
}

/** Answer with a thrown CDP error, e.g. a runtime with no evaluate handler. */
function mockEvaluateThrowing(error: unknown) {
  const evaluateAsync = jest.fn(async () => {
    throw error;
  });
  jest.mocked(CdpClient).mockImplementation(() => ({ evaluateAsync }) as any);
  return evaluateAsync;
}

function printed(): string {
  return jest.mocked(console.log).mock.calls.flat().join('\n');
}

function json(): any {
  return JSON.parse(printed());
}

/** Everything the run put on stderr: the explanation, and the `Try:` line under it. */
function stderr(): string {
  return [
    ...jest.mocked(console.error).mock.calls.flat(),
    ...jest.mocked(console.warn).mock.calls.flat(),
  ].join('\n');
}

beforeEach(() => {
  originalFetch = globalThis.fetch;
  mockDevServer();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  }
});

const treeOptions = {
  testID: null,
  full: false,
  allScreens: false,
  maxNodes: DEFAULT_MAX_NODES,
  devServerUrl: null,
  json: true,
};

const tapOptions = {
  testID: 'add-note',
  index: null,
  allScreens: false,
  force: false,
  verify: false,
  maxNodes: DEFAULT_MAX_NODES,
  devServerUrl: null,
  json: true,
};

const typeOptions = {
  ...tapOptions,
  testID: 'note-input',
  text: 'hello',
  submit: false,
};

/** The answer a healthy tree walk comes back with. */
function treeAnswer(overrides: Record<string, unknown> = {}) {
  return {
    supported: true,
    reason: null,
    testID: null,
    focusedScreen: 'notes',
    screensSeen: ['index', 'notes'],
    allScreens: false,
    projection: 'interactive',
    fibersWalked: 504,
    nodeCount: 1,
    truncated: false,
    nodes: [
      {
        component: 'Pressable',
        testID: 'add-note',
        accessibilityLabel: null,
        accessibilityRole: null,
        text: null,
        handlers: ['onPress'],
        interactive: true,
        host: false,
        depth: 130,
        screen: 'notes',
      },
    ],
    matched: 0,
    matches: [],
    ...overrides,
  };
}

/** The answer a healthy tap comes back with. */
function tapAnswer(overrides: Record<string, unknown> = {}) {
  return {
    supported: true,
    testID: 'add-note',
    matched: 1,
    index: 0,
    component: 'Pressable',
    screen: 'notes',
    focusedScreen: 'notes',
    screensSeen: ['notes'],
    allScreens: false,
    groupSize: 3,
    handler: 'onPress',
    handlerOn: 'Pressable',
    handlerOutsideMatch: false,
    disabled: false,
    disabledOn: null,
    disabledComponent: null,
    forced: false,
    called: true,
    threw: null,
    reason: null,
    candidates: [{ index: 0, component: 'Pressable', screen: 'notes' }],
    ...overrides,
  };
}

describe(runtimeTreeAsync, () => {
  it(`prints one JSON object and exits 0`, async () => {
    mockEvaluate(treeAnswer());

    expect(await runtimeTreeAsync(treeOptions)).toBe(EXIT_OK);
    expect(json()).toMatchObject({
      devServerUrl,
      focusedScreen: 'notes',
      projection: 'interactive',
      nodeCount: 1,
      truncated: false,
      maxNodes: DEFAULT_MAX_NODES,
      matched: 0,
      ok: true,
      untrusted: expect.arrayContaining(['nodes']),
    });
  });

  it(`sends one evaluate carrying the options it was given`, async () => {
    const evaluateAsync = mockEvaluate(treeAnswer());

    await runtimeTreeAsync({ ...treeOptions, full: true, allScreens: true, maxNodes: 12 });

    expect(evaluateAsync).toHaveBeenCalledTimes(1);
    const expression = evaluateAsync.mock.calls[0]![0];
    expect(expression).toContain('var FULL = true');
    expect(expression).toContain('var ALL_SCREENS = true');
    expect(expression).toContain('var MAX = 12');
  });

  it(`keeps every key when the walk kept nothing`, async () => {
    mockEvaluate(treeAnswer({ nodes: [], nodeCount: 0, focusedScreen: null, screensSeen: [] }));

    expect(await runtimeTreeAsync(treeOptions)).toBe(EXIT_OK);
    expect(Object.keys(json()).sort()).toEqual([
      'allScreens',
      'devServerUrl',
      'fibersWalked',
      'focusedScreen',
      'matched',
      'matches',
      'maxNodes',
      'nodeCount',
      'nodes',
      'ok',
      'projection',
      'screensSeen',
      'testID',
      'truncated',
      'untrusted',
    ]);
  });

  // An empty screen is a report; a named testID that matched nothing is an outcome that failed,
  // because the caller asked a yes/no question about the app (llp/0010 §Exit codes).
  it(`exits 20 when a named testID matched nothing`, async () => {
    mockEvaluate(treeAnswer({ testID: 'nope', matched: 0, nodes: [], nodeCount: 0 }));

    expect(await runtimeTreeAsync({ ...treeOptions, testID: 'nope' })).toBe(EXIT_OUTCOME_FAILED);
    expect(json().ok).toBe(false);
    expect(stderr()).toContain('nope');
  });

  it(`prints the human report when --json was not passed`, async () => {
    mockEvaluate(treeAnswer());

    await runtimeTreeAsync({ ...treeOptions, json: false });

    expect(printed()).toContain('BEGIN UNTRUSTED APP OUTPUT');
    expect(() => json()).toThrow();
  });
});

// @ref llp/0014 §What the implementer must not lose, item 8.
describe('a runtime with no fiber tree to walk', () => {
  it(`refuses rather than reporting an empty screen`, async () => {
    mockEvaluate({ supported: false, reason: 'no-devtools-hook' });

    await expect(runtimeTreeAsync(treeOptions)).rejects.toMatchObject({
      code: 'RUNTIME_TREE_UNSUPPORTED',
    });
  });

  it(`refuses the same way for a hook with no getFiberRoots`, async () => {
    mockEvaluate({ supported: false, reason: 'no-get-fiber-roots' });

    await expect(runtimeTapAsync(tapOptions)).rejects.toMatchObject({
      code: 'RUNTIME_TREE_UNSUPPORTED',
    });
  });

  it(`names a development build, because a release bundle installs no hook`, async () => {
    mockEvaluate({ supported: false, reason: 'no-devtools-hook' });

    const error = await runtimeTypeAsync(typeOptions).catch((caught: CommandError) => caught);

    expect(error).toBeInstanceOf(CommandError);
    expect((error as CommandError).message).toMatch(/development/i);
  });

  // The Expo Go Android case: the runtime carries no CDP debugger at all, which is a different
  // failure from a runtime that answered and had no hook.
  it(`is told apart from a runtime with no evaluate handler`, async () => {
    mockEvaluateThrowing(new CdpRequestError('method not found', RPC_METHOD_NOT_FOUND));

    await expect(runtimeTreeAsync(treeOptions)).rejects.toMatchObject({
      code: 'RUNTIME_EVALUATE_UNSUPPORTED',
    });
  });

  it(`reports an expression that threw inside the app as a tool failure`, async () => {
    const evaluateAsync = jest.fn(async () => ({
      exceptionText: 'TypeError: undefined is not an object',
      exceptionStack: null,
    }));
    jest.mocked(CdpClient).mockImplementation(() => ({ evaluateAsync }) as any);

    await expect(runtimeTreeAsync(treeOptions)).rejects.toMatchObject({
      code: 'RUNTIME_TREE_FAILED',
    });
  });
});

describe(runtimeTapAsync, () => {
  it(`reports a tap that was made, and exits 0`, async () => {
    mockEvaluate(tapAnswer());

    expect(await runtimeTapAsync(tapOptions)).toBe(EXIT_OK);
    expect(json()).toMatchObject({
      devServerUrl,
      testID: 'add-note',
      matched: 1,
      index: 0,
      handler: 'onPress',
      handlerOn: 'Pressable',
      handlerOutsideMatch: false,
      called: true,
      threw: null,
      reason: null,
      ok: true,
      verify: null,
    });
  });

  it(`sends the testID, the index, the scope and the force into the expression`, async () => {
    const evaluateAsync = mockEvaluate(tapAnswer());

    await runtimeTapAsync({ ...tapOptions, index: 2, allScreens: true, force: true });

    const expression = evaluateAsync.mock.calls[0]![0];
    expect(expression).toContain('var TESTID = "add-note"');
    expect(expression).toContain('var INDEX = 2');
    expect(expression).toContain('var ALL_SCREENS = true');
    expect(expression).toContain('var FORCE = true');
  });

  it.each([
    ['no-match', 0, {}],
    ['ambiguous', 3, {}],
    ['index-out-of-range', 1, {}],
    ['disabled', 1, { disabled: true, disabledOn: 'disabled', disabledComponent: 'Pressable' }],
    ['no-handler', 1, {}],
  ])(`exits 20 for %p, and says on stderr what to run next`, async (reason, matched, extra) => {
    mockEvaluate(
      tapAnswer({ reason, matched, called: false, index: null, handler: null, ...extra })
    );

    expect(await runtimeTapAsync(tapOptions)).toBe(EXIT_OUTCOME_FAILED);
    expect(json()).toMatchObject({ ok: false, called: false, reason });
    expect(stderr()).toContain('npx exagent');
  });

  // The tap landed and the app's own code raised, which is an outcome of the app rather than a
  // failure of the command — so it is the 20 band, not the 1 band.
  it(`exits 20 when the handler threw, and still reports the tap as made`, async () => {
    mockEvaluate(tapAnswer({ threw: { text: 'Error: boom', stack: null } }));

    expect(await runtimeTapAsync(tapOptions)).toBe(EXIT_OUTCOME_FAILED);
    expect(json()).toMatchObject({ called: true, ok: false, threw: { text: 'Error: boom' } });
  });

  describe('--verify', () => {
    it(`walks before and after, and reports what changed`, async () => {
      const before = treeAnswer({ nodes: [] });
      const after = treeAnswer({
        nodes: [
          {
            component: 'RCTText',
            testID: 'note-row',
            accessibilityLabel: null,
            accessibilityRole: null,
            text: 'a new note',
            handlers: [],
            interactive: false,
            host: true,
            depth: 140,
            screen: 'notes',
          },
        ],
        nodeCount: 1,
      });
      const evaluateAsync = mockEvaluate(before, tapAnswer(), after);

      expect(await runtimeTapAsync({ ...tapOptions, verify: true })).toBe(EXIT_OK);
      expect(evaluateAsync).toHaveBeenCalledTimes(3);
      expect(json().verify).toMatchObject({
        waitedMs: VERIFY_SETTLE_MS,
        changed: true,
        removed: [],
        changedText: [],
      });
      expect(json().verify.added[0]).toMatchObject({ testID: 'note-row', text: 'a new note' });
    });

    it(`says nothing changed rather than claiming the tap did nothing`, async () => {
      const snapshot = treeAnswer();
      mockEvaluate(snapshot, tapAnswer(), snapshot);

      expect(await runtimeTapAsync({ ...tapOptions, verify: true })).toBe(EXIT_OK);
      expect(json().verify).toMatchObject({ changed: false, added: [], removed: [] });
    });

    // A refusal made no call, so there is nothing for a second walk to be evidence about.
    it(`does not walk twice for a tap that was refused`, async () => {
      const evaluateAsync = mockEvaluate(
        treeAnswer(),
        tapAnswer({ reason: 'no-match', matched: 0, called: false })
      );

      expect(await runtimeTapAsync({ ...tapOptions, verify: true })).toBe(EXIT_OUTCOME_FAILED);
      expect(evaluateAsync).toHaveBeenCalledTimes(2);
      expect(json().verify).toBeNull();
    });
  });
});

describe(runtimeTypeAsync, () => {
  it(`reports the text it typed, and exits 0`, async () => {
    mockEvaluate({
      ...tapAnswer(),
      testID: 'note-input',
      component: 'TextInput',
      handler: 'onChangeText',
      handlerOn: 'TextInput',
      submitted: false,
      submitHandlerOn: null,
    });

    expect(await runtimeTypeAsync(typeOptions)).toBe(EXIT_OK);
    expect(json()).toMatchObject({
      testID: 'note-input',
      text: 'hello',
      handler: 'onChangeText',
      called: true,
      submitted: false,
      ok: true,
    });
  });

  it(`sends the text and the submit into the expression`, async () => {
    const evaluateAsync = mockEvaluate({
      ...tapAnswer(),
      submitted: true,
      submitHandlerOn: 'TextInput',
    });

    await runtimeTypeAsync({ ...typeOptions, submit: true });

    const expression = evaluateAsync.mock.calls[0]![0];
    expect(expression).toContain('var TEXT = "hello"');
    expect(expression).toContain('var SUBMIT = true');
  });

  it(`exits 20 when --submit found nothing to call, and says the text went in`, async () => {
    mockEvaluate({
      ...tapAnswer(),
      handler: 'onChangeText',
      reason: 'no-submit-handler',
      submitted: false,
      submitHandlerOn: null,
    });

    expect(await runtimeTypeAsync({ ...typeOptions, submit: true })).toBe(EXIT_OUTCOME_FAILED);
    expect(json()).toMatchObject({ called: true, submitted: false, ok: false });
    expect(stderr()).toMatch(/text/i);
  });
});
