/* eslint-env jest */
// @ref llp/0014-interaction-spike.notes.md
// @ref llp/0018-interaction-commands.rfc.md
//
// `runtime:tree`, `runtime:tap` and `runtime:type` against the published bin. A unit test proves
// what the expression decides; this proves the parts only a process boundary has: that the built
// bundle resolves these command names at all, that exactly one JSON object reaches stdout on both
// the passing and the failing path, and that the exit code an agent branches on is the one the
// convention promises.
//
// The app is a stub: the inspector socket answers `Runtime.evaluate` with the object the real
// expression would have returned, taken from the shapes `src/runtime/__tests__/fixtures/
// spike-view-tree/` recorded. What the expression *computes* is not under test here — it has its
// own suite, which runs it against fibers.

import {
  executeExagentAsync,
  setupFixtureAsync,
  startStubDevServerAsync,
  stubExpoEnv,
} from '../utils';

const EXPO_GO_TARGET = {
  id: '1',
  appId: 'host.exp.Exponent',
  title: 'React Native Experimental (Improved Chrome Reloads)',
  description: 'host.exp.Exponent',
  type: 'node',
  devtoolsFrontendUrl: '',
  webSocketDebuggerUrl: 'ws://127.0.0.1:8081/inspector/debug?device=1&page=1',
  deviceName: 'iPhone 17 Pro',
  reactNative: { capabilities: { nativePageReloads: true }, logicalDeviceId: 'device-1' },
};

/** The answer a healthy tree walk gives, in the shape the expression returns it. */
function treeAnswer(overrides: Record<string, unknown> = {}) {
  return {
    supported: true,
    reason: null,
    testID: null,
    focusedScreen: 'notes',
    screensSeen: ['index', 'explore', 'notes'],
    allScreens: false,
    projection: 'interactive',
    fibersWalked: 504,
    nodeCount: 2,
    truncated: false,
    nodes: [
      node({ component: 'TextInput', testID: 'note-input', handlers: ['onChangeText'] }),
      node({ component: 'Pressable', testID: 'add-note', handlers: ['onPress'] }),
    ],
    matched: 0,
    matches: [],
    ...overrides,
  };
}

function node(overrides: Record<string, unknown> = {}) {
  return {
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
    ...overrides,
  };
}

/** The answer a healthy tap or type gives. */
function callAnswer(overrides: Record<string, unknown> = {}) {
  return {
    supported: true,
    testID: 'add-note',
    matched: 1,
    index: 0,
    component: 'Pressable',
    screen: 'notes',
    focusedScreen: 'notes',
    screensSeen: ['index', 'explore', 'notes'],
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

/**
 * Route one evaluate to the answer for the expression that was sent.
 *
 * The CLI wraps every expression before it sends it, so the marker each command's own source
 * carries is what tells them apart — `var FULL =` for a tree walk, `var TEXT =` for a type.
 */
function responder(answers: { tree?: unknown; tap?: unknown; type?: unknown }) {
  return (expression: string): unknown => {
    if (expression.includes('var TEXT =')) {
      return answers.type;
    }
    if (expression.includes('var TESTID =')) {
      return answers.tap;
    }
    if (expression.includes('var FULL =')) {
      return answers.tree;
    }
    // The target selector's own probe, which asks for a global this app does not set.
    return undefined;
  };
}

let projectRoot: string;
beforeAll(async () => {
  projectRoot = await setupFixtureAsync('go-app');
});

describe('exagent runtime:tree', () => {
  it(`prints one JSON object naming the screen it read, and exits 0`, async () => {
    const devServer = await startStubDevServerAsync({
      targets: [EXPO_GO_TARGET],
      inspectorEvaluate: responder({ tree: treeAnswer() }),
    });
    try {
      const result = await executeExagentAsync(
        projectRoot,
        ['runtime:tree', '--dev-server-url', devServer.url, '--json'],
        { env: stubExpoEnv(projectRoot) }
      );

      expect(result.exitCode).toBe(0);
      const report = JSON.parse(result.stdout);
      expect(report).toMatchObject({
        devServerUrl: devServer.url,
        focusedScreen: 'notes',
        screensSeen: ['index', 'explore', 'notes'],
        projection: 'interactive',
        nodeCount: 2,
        truncated: false,
        matched: 0,
        ok: true,
      });
      expect(report.nodes.map((entry: { testID: string }) => entry.testID)).toEqual([
        'note-input',
        'add-note',
      ]);
      expect(report.untrusted).toContain('nodes');
    } finally {
      await devServer.close();
    }
  });

  it(`fences the app's own strings in the human report`, async () => {
    const devServer = await startStubDevServerAsync({
      targets: [EXPO_GO_TARGET],
      inspectorEvaluate: responder({ tree: treeAnswer() }),
    });
    try {
      const result = await executeExagentAsync(projectRoot, [
        'runtime:tree',
        '--dev-server-url',
        devServer.url,
      ]);

      expect(result.stdout).toContain('--- BEGIN UNTRUSTED APP OUTPUT ---');
      expect(result.stdout).toContain('--- END UNTRUSTED APP OUTPUT ---');
      expect(result.stdout).toContain('add-note');
    } finally {
      await devServer.close();
    }
  });

  it(`exits 20 with one JSON object when a --testID matched nothing`, async () => {
    const devServer = await startStubDevServerAsync({
      targets: [EXPO_GO_TARGET],
      inspectorEvaluate: responder({
        tree: treeAnswer({ testID: 'nope', matched: 0, nodes: [], nodeCount: 0 }),
      }),
    });
    try {
      const result = await executeExagentAsync(
        projectRoot,
        ['runtime:tree', '--testID', 'nope', '--dev-server-url', devServer.url, '--json'],
        { reject: false }
      );

      expect(result.exitCode).toBe(20);
      expect(JSON.parse(result.stdout)).toMatchObject({ ok: false, matched: 0, testID: 'nope' });
      expect(result.stderr).toContain('nope');
    } finally {
      await devServer.close();
    }
  });

  // @ref llp/0014 §What the implementer must not lose, item 8: never a partial tree.
  it(`refuses a runtime with no DevTools hook, with the error envelope on stdout`, async () => {
    const devServer = await startStubDevServerAsync({
      targets: [EXPO_GO_TARGET],
      inspectorEvaluate: responder({ tree: { supported: false, reason: 'no-devtools-hook' } }),
    });
    try {
      const result = await executeExagentAsync(
        projectRoot,
        ['runtime:tree', '--dev-server-url', devServer.url, '--json'],
        { reject: false }
      );

      expect(result.exitCode).toBe(1);
      expect(JSON.parse(result.stdout)).toMatchObject({
        error: {
          code: 'RUNTIME_TREE_UNSUPPORTED',
          message: expect.stringContaining('DevTools'),
          suggestedCommand: expect.stringContaining('npx exagent runtime:eval'),
          needsHuman: null,
        },
      });
    } finally {
      await devServer.close();
    }
  });

  it(`is reachable by the space form as well as the colon form`, async () => {
    const devServer = await startStubDevServerAsync({
      targets: [EXPO_GO_TARGET],
      inspectorEvaluate: responder({ tree: treeAnswer() }),
    });
    try {
      const result = await executeExagentAsync(projectRoot, [
        'runtime',
        'tree',
        '--dev-server-url',
        devServer.url,
        '--json',
      ]);

      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout).ok).toBe(true);
    } finally {
      await devServer.close();
    }
  });
});

describe('exagent runtime:tap', () => {
  it(`reports the tap it made, and exits 0`, async () => {
    const devServer = await startStubDevServerAsync({
      targets: [EXPO_GO_TARGET],
      inspectorEvaluate: responder({ tap: callAnswer() }),
    });
    try {
      const result = await executeExagentAsync(projectRoot, [
        'runtime:tap',
        'add-note',
        '--dev-server-url',
        devServer.url,
        '--json',
      ]);

      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({
        testID: 'add-note',
        matched: 1,
        index: 0,
        handler: 'onPress',
        handlerOn: 'Pressable',
        handlerOutsideMatch: false,
        called: true,
        threw: null,
        ok: true,
        verify: null,
      });
    } finally {
      await devServer.close();
    }
  });

  it(`exits 20 for an ambiguous testID, and names --index on stderr`, async () => {
    const devServer = await startStubDevServerAsync({
      targets: [EXPO_GO_TARGET],
      inspectorEvaluate: responder({
        tap: callAnswer({
          matched: 3,
          index: null,
          called: false,
          reason: 'ambiguous',
          handler: null,
          handlerOn: null,
          candidates: [
            { index: 0, component: 'Pressable', screen: 'notes' },
            { index: 1, component: 'Pressable', screen: 'notes' },
            { index: 2, component: 'Pressable', screen: 'notes' },
          ],
        }),
      }),
    });
    try {
      const result = await executeExagentAsync(
        projectRoot,
        ['runtime:tap', 'row', '--dev-server-url', devServer.url, '--json'],
        { reject: false }
      );

      expect(result.exitCode).toBe(20);
      expect(JSON.parse(result.stdout)).toMatchObject({
        matched: 3,
        called: false,
        reason: 'ambiguous',
        ok: false,
      });
      expect(result.stderr).toContain('--index');
      expect(result.stderr).toContain('Try: npx exagent runtime:tap add-note --index 0');
    } finally {
      await devServer.close();
    }
  });

  // @ref llp/0014 §`disabled` does not remove the handler.
  it(`refuses a disabled element, and --force is what overrides it`, async () => {
    const disabled = callAnswer({
      called: false,
      reason: 'disabled',
      disabled: true,
      disabledOn: 'disabled',
      disabledComponent: 'Pressable',
      handler: null,
      handlerOn: null,
    });
    const devServer = await startStubDevServerAsync({
      targets: [EXPO_GO_TARGET],
      // The forced run is told apart by the flag the CLI put into the expression it sent.
      inspectorEvaluate: (expression) => {
        if (!expression.includes('var TESTID =')) {
          return undefined;
        }
        return expression.includes('var FORCE = true')
          ? callAnswer({ disabled: true, disabledOn: 'disabled', forced: true })
          : disabled;
      },
    });
    try {
      const refused = await executeExagentAsync(
        projectRoot,
        ['runtime:tap', 'disabled-btn', '--dev-server-url', devServer.url, '--json'],
        { reject: false }
      );
      expect(refused.exitCode).toBe(20);
      expect(JSON.parse(refused.stdout)).toMatchObject({ called: false, reason: 'disabled' });
      expect(refused.stderr).toContain('--force');

      const forced = await executeExagentAsync(projectRoot, [
        'runtime:tap',
        'disabled-btn',
        '--force',
        '--dev-server-url',
        devServer.url,
        '--json',
      ]);
      expect(forced.exitCode).toBe(0);
      expect(JSON.parse(forced.stdout)).toMatchObject({
        called: true,
        disabled: true,
        forced: true,
        ok: true,
      });
    } finally {
      await devServer.close();
    }
  });

  it(`walks the tree again under --verify and reports what changed`, async () => {
    let walks = 0;
    const devServer = await startStubDevServerAsync({
      targets: [EXPO_GO_TARGET],
      inspectorEvaluate: (expression) => {
        if (expression.includes('var TESTID =')) {
          return callAnswer();
        }
        if (expression.includes('var FULL =')) {
          walks += 1;
          return walks === 1
            ? treeAnswer({ nodes: [], nodeCount: 0 })
            : treeAnswer({
                nodes: [node({ component: 'RCTText', testID: 'note-row', text: 'a new note' })],
                nodeCount: 1,
              });
        }
        return undefined;
      },
    });
    try {
      const result = await executeExagentAsync(projectRoot, [
        'runtime:tap',
        'add-note',
        '--verify',
        '--dev-server-url',
        devServer.url,
        '--json',
      ]);

      expect(result.exitCode).toBe(0);
      const report = JSON.parse(result.stdout);
      expect(walks).toBe(2);
      expect(report.verify).toMatchObject({ changed: true, removed: [], changedText: [] });
      expect(report.verify.added[0]).toMatchObject({ testID: 'note-row', text: 'a new note' });
    } finally {
      await devServer.close();
    }
  });

  it(`refuses a run that names no testID`, async () => {
    const result = await executeExagentAsync(projectRoot, ['runtime:tap', '--json'], {
      reject: false,
    });

    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({ error: { code: 'BAD_ARGS' } });
  });
});

describe('exagent runtime:type', () => {
  it(`reports the text it typed, and exits 0`, async () => {
    const devServer = await startStubDevServerAsync({
      targets: [EXPO_GO_TARGET],
      inspectorEvaluate: responder({
        type: callAnswer({
          testID: 'note-input',
          component: 'TextInput',
          handler: 'onChangeText',
          handlerOn: 'TextInput',
          submitted: false,
          submitHandlerOn: null,
        }),
      }),
    });
    try {
      const result = await executeExagentAsync(projectRoot, [
        'runtime:type',
        'a new note',
        '--testID',
        'note-input',
        '--dev-server-url',
        devServer.url,
        '--json',
      ]);

      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({
        testID: 'note-input',
        text: 'a new note',
        handler: 'onChangeText',
        called: true,
        submitted: false,
        ok: true,
      });
    } finally {
      await devServer.close();
    }
  });

  it(`carries --submit into the app and reports what it did`, async () => {
    const devServer = await startStubDevServerAsync({
      targets: [EXPO_GO_TARGET],
      inspectorEvaluate: (expression) =>
        expression.includes('var SUBMIT = true')
          ? callAnswer({
              testID: 'note-input',
              handler: 'onChangeText',
              handlerOn: 'TextInput',
              submitted: true,
              submitHandlerOn: 'TextInput',
            })
          : undefined,
    });
    try {
      const result = await executeExagentAsync(projectRoot, [
        'runtime:type',
        'hello',
        '--testID',
        'note-input',
        '--submit',
        '--dev-server-url',
        devServer.url,
        '--json',
      ]);

      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({
        submitted: true,
        submitHandlerOn: 'TextInput',
        ok: true,
      });
    } finally {
      await devServer.close();
    }
  });

  it(`refuses a run with no --testID, naming the flag`, async () => {
    const result = await executeExagentAsync(projectRoot, ['runtime:type', 'hello', '--json'], {
      reject: false,
    });

    expect(result.exitCode).toBe(1);
    const envelope = JSON.parse(result.stdout);
    expect(envelope.error.code).toBe('BAD_ARGS');
    expect(envelope.error.message).toContain('--testID');
  });
});

describe('the three commands in the help', () => {
  // @ref llp/0016-v1-scope.rfc.md §The graduation review
  // Graduated in wave 36, so the group they are in carries no tag and no footnote at all. The mark
  // is what an agent reads before it decides whether to build a loop on a command, and these three
  // are rungs 3 and 4 of the workflow map that same help prints.
  it(`are listed as ordinary actions of the runtime group`, async () => {
    const result = await executeExagentAsync(projectRoot, ['runtime', '--help']);

    for (const action of ['runtime:tree', 'runtime:tap', 'runtime:type']) {
      expect(result.stdout).toContain(action);
    }
    expect(result.stdout).not.toContain('[experimental]');
    expect(result.stdout).not.toContain('experimental commands may change or vanish');
  });

  it(`say in their own help what they do not do`, async () => {
    const tap = await executeExagentAsync(projectRoot, ['runtime:tap', '--help']);
    expect(tap.stdout).toContain('calls a prop');
    expect(tap.stdout).toContain('synthetic event');
    expect(tap.stdout).toMatch(/invisible button/i);
    expect(tap.stdout).toContain('Expo Go for Android');

    const type = await executeExagentAsync(projectRoot, ['runtime:type', '--help']);
    expect(type.stdout).toContain('never focused');

    const tree = await executeExagentAsync(projectRoot, ['runtime:tree', '--help']);
    expect(tree.stdout).toContain('--all-screens');
    expect(tree.stdout).toContain('geometry');
  });
});

// @ref llp/0018-interaction-commands.rfc.md §The bundle gate — friction run 7, F62.
//
// The unit suite proves what the gate decides; this proves the parts only a process boundary has:
// the exit code an agent branches on, one JSON object on stdout, and that the app is never asked
// anything when the project does not compile.
describe('the entry bundle gate', () => {
  it(`stops runtime:tree at exit 20 without evaluating anything`, async () => {
    const sent: string[] = [];
    const devServer = await startStubDevServerAsync({
      targets: [EXPO_GO_TARGET],
      bundle: 'broken',
      inspectorEvaluate: (expression) => {
        sent.push(expression);
        return treeAnswer();
      },
    });
    try {
      const result = await executeExagentAsync(
        projectRoot,
        ['runtime:tree', '--dev-server-url', devServer.url, '--json'],
        { reject: false, env: stubExpoEnv(projectRoot) }
      );

      expect(result.exitCode).toBe(20);
      const report = JSON.parse(result.stdout);
      expect(report).toMatchObject({
        ok: false,
        reason: 'bundle-broken',
        nodes: [],
        bundle: { checked: true, ok: false, error: { filename: 'src/app/index.tsx' } },
      });
      expect(sent).toEqual([]);
      expect(result.stderr).toContain('does not compile');
      expect(result.stderr).toContain('src/app/index.tsx:101:2');
    } finally {
      await devServer.close();
    }
  });

  it(`stops runtime:tap before it calls the handler, and says what to run`, async () => {
    const devServer = await startStubDevServerAsync({
      targets: [EXPO_GO_TARGET],
      bundle: 'broken',
      inspectorEvaluate: responder({ tap: callAnswer() }),
    });
    try {
      const result = await executeExagentAsync(
        projectRoot,
        ['runtime:tap', 'add-note', '--verify', '--dev-server-url', devServer.url, '--json'],
        { reject: false, env: stubExpoEnv(projectRoot) }
      );

      expect(result.exitCode).toBe(20);
      expect(JSON.parse(result.stdout)).toMatchObject({
        ok: false,
        called: false,
        reason: 'bundle-broken',
        verify: null,
      });
      expect(result.stderr).toContain('Try: npx exagent runtime:reload');
    } finally {
      await devServer.close();
    }
  });

  it(`stops runtime:type before it types`, async () => {
    const devServer = await startStubDevServerAsync({
      targets: [EXPO_GO_TARGET],
      bundle: 'broken',
      inspectorEvaluate: responder({ type: callAnswer() }),
    });
    try {
      const result = await executeExagentAsync(
        projectRoot,
        [
          'runtime:type',
          'stale',
          '--testID',
          'note-input',
          '--dev-server-url',
          devServer.url,
          '--json',
        ],
        { reject: false, env: stubExpoEnv(projectRoot) }
      );

      expect(result.exitCode).toBe(20);
      expect(JSON.parse(result.stdout)).toMatchObject({ called: false, reason: 'bundle-broken' });
    } finally {
      await devServer.close();
    }
  });

  it(`is declined by --no-bundle-check, which is the deliberate override`, async () => {
    const devServer = await startStubDevServerAsync({
      targets: [EXPO_GO_TARGET],
      bundle: 'broken',
      inspectorEvaluate: responder({ tree: treeAnswer() }),
    });
    try {
      const result = await executeExagentAsync(projectRoot, [
        'runtime:tree',
        '--no-bundle-check',
        '--dev-server-url',
        devServer.url,
        '--json',
      ]);

      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({
        ok: true,
        bundle: { checked: false, ok: null, reason: expect.stringContaining('--no-bundle-check') },
      });
    } finally {
      await devServer.close();
    }
  });
});

// @ref llp/0018-interaction-commands.rfc.md §Follow-ups — friction run 7, F75.
describe('the follow-ups of the three commands', () => {
  it(`prints a Suggested next: block naming a testID this walk found`, async () => {
    const devServer = await startStubDevServerAsync({
      targets: [EXPO_GO_TARGET],
      inspectorEvaluate: responder({ tree: treeAnswer() }),
    });
    try {
      const result = await executeExagentAsync(projectRoot, [
        'runtime:tree',
        '--dev-server-url',
        devServer.url,
      ]);

      expect(result.stdout).toContain('Suggested next:');
      expect(result.stdout).toContain('npx exagent runtime:tap add-note --verify');
    } finally {
      await devServer.close();
    }
  });

  it(`leaves them out under --no-followups, and carries them in --json`, async () => {
    const devServer = await startStubDevServerAsync({
      targets: [EXPO_GO_TARGET],
      inspectorEvaluate: responder({ tap: callAnswer() }),
    });
    try {
      const quiet = await executeExagentAsync(projectRoot, [
        'runtime:tap',
        'add-note',
        '--no-followups',
        '--dev-server-url',
        devServer.url,
      ]);
      expect(quiet.stdout).not.toContain('Suggested next:');

      const json = await executeExagentAsync(projectRoot, [
        'runtime:tap',
        'add-note',
        '--dev-server-url',
        devServer.url,
        '--json',
      ]);
      expect(JSON.parse(json.stdout).followups[0]).toMatchObject({ id: 'tap-verify' });
      // One JSON object on stdout, follow-ups and all.
      expect(json.stdout.trim().startsWith('{')).toBe(true);
    } finally {
      await devServer.close();
    }
  });
});

// @ref llp/0018-interaction-commands.rfc.md §Negative numbers — friction run 7, F73.
describe('a negative --index', () => {
  it(`is refused for what it is, not as a flag with nothing after it`, async () => {
    const result = await executeExagentAsync(
      projectRoot,
      ['runtime:tap', 'dup-btn', '--index', '-1', '--json'],
      { reject: false }
    );

    expect(result.exitCode).toBe(1);
    const envelope = JSON.parse(result.stdout);
    expect(envelope.error.code).toBe('BAD_ARGS');
    expect(envelope.error.message).toContain('--index must be a whole number of 0 or more, but got -1');
    expect(envelope.error.message).not.toContain('nothing after it');
  });
});
