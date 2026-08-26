// @ref llp/0014-interaction-spike.notes.md
// @ref llp/0018-interaction-commands.rfc.md
// @ref llp/0005-runtime-loop-tools.rfc.md
// The command layer of `runtime:tree`, `runtime:tap` and `runtime:type`.
//
// Each command is one question, sent as one `Runtime.evaluate` through the same `CdpClient` that
// `runtime:eval` uses — the spike proved that path carries this unchanged, wrapper and all
// (llp/0014 §Recommendation). This file does four things and no more: find the app, send the
// expression, turn the answer into a stable payload, and pick the exit code.
//
// Two refusals it must keep apart, because their recoveries are opposite:
//
//  - **`RUNTIME_EVALUATE_UNSUPPORTED`** — the runtime has no CDP debugger at all, which is what
//    Expo Go for Android ships. Nothing can be evaluated in it, ever.
//  - **`RUNTIME_TREE_UNSUPPORTED`** — the runtime answered, and has no React DevTools hook. That is
//    a release bundle, or a React that stopped installing one. A partial tree is never returned in
//    its place: an agent cannot tell "no button on this screen" from "I could not look".
//
// Both are tool errors (exit 1): retrying the same command unchanged is pointless. Everything the
// *app* decides — no match, several matches, a disabled element, a handler that threw — is the 20
// band, where retrying with a different flag is exactly what to do (llp/0010 §Exit codes).

import { event } from '../../events';
import { EXIT_OK, EXIT_OUTCOME_FAILED } from '../../exitCodes';
import * as Log from '../../log';
import { CommandError } from '../../utils/errors';
import { CdpClient, isMethodNotFoundError, type CdpEvaluateResult } from '../cdpClient';
import { probeDevServerAsync, requireConnectedAppAsync } from '../devServer';
import { evaluateUnsupportedError, resolveDevServerUrlAsync, type RuntimeContext } from '../runtimeAsync';
import { buildDeviceNameIndexIfNeededAsync } from '../targetPlatform';
import {
  buildSnapshotExpression,
  buildTapExpression,
  buildTreeExpression,
  buildTypeExpression,
} from './expression';
import {
  diffSnapshots,
  explainTapFailure,
  explainTypeFailure,
  formatTap,
  formatTree,
  formatType,
  UNTRUSTED_CALL_FIELDS,
  UNTRUSTED_TREE_FIELDS,
} from './format';
import type {
  RuntimeTapOptions,
  RuntimeTreeOptions,
  RuntimeTypeOptions,
} from './resolveOptions';
import type {
  RuntimeTapJson,
  RuntimeTreeJson,
  RuntimeTypeJson,
  TreeMatchJson,
  TreeNodeJson,
} from './types';

/**
 * How long the app is given to commit before `--verify` looks again.
 *
 * A React state update is not a synchronous repaint, so a walk sent in the same millisecond as the
 * tap would read the tree from before it. One second is the wait the spike allowed, and what it
 * observed at: after the tap the input was empty and the new row was in the list (llp/0014
 * §Verdict 5). A second walk itself costs 8 ms.
 */
export const VERIFY_SETTLE_MS = 1000;

/**
 * How long the app is given to answer one of these expressions.
 *
 * Fixed rather than a flag: the walk is bounded by the fiber count, and the largest the spike
 * measured — 3279 fibers with 300 extra list rows — answered in 25 ms. A wait this far above that
 * is only ever reached by a JavaScript thread that is blocked, which no flag would fix.
 */
const EVALUATE_TIMEOUT_MS = 10_000;

/** What the expression answers with, before it is turned into a payload. */
interface RawAnswer {
  supported: boolean;
  reason?: string | null;
  [key: string]: unknown;
}

/** A debugger connection to the app these commands drive, and the dev server it went through. */
async function openAppAsync(
  options: { devServerUrl: string | null; platform?: RuntimeTreeOptions['platform'] },
  context: RuntimeContext
): Promise<{ devServerUrl: string; client: CdpClient }> {
  const devServerUrl = await resolveDevServerUrlAsync(options, context);
  // Read once and passed to both, so the platform this command was told about is the platform of
  // the app it drives, and the two steps cannot disagree about which app that is.
  const deviceIndex =
    options.platform == null
      ? undefined
      : await buildDeviceNameIndexIfNeededAsync((await probeDevServerAsync(devServerUrl)).targets);
  await requireConnectedAppAsync(devServerUrl, {
    explicit: options.devServerUrl != null,
    platform: options.platform,
    deviceIndex,
  });

  return {
    devServerUrl,
    client: new CdpClient({ metroUrl: devServerUrl, platform: options.platform, deviceIndex }),
  };
}

/** Send one expression and read the object it answered with, or refuse. */
async function askAppAsync(
  client: CdpClient,
  expression: string,
  devServerUrl: string
): Promise<RawAnswer> {
  let result: CdpEvaluateResult;
  try {
    result = await client.evaluateAsync(expression, {
      // These expressions return a plain object and never a thenable, so there is nothing to park
      // in the app and nothing to poll for.
      awaitPromise: false,
      timeoutMs: EVALUATE_TIMEOUT_MS,
    });
  } catch (error: unknown) {
    if (isMethodNotFoundError(error)) {
      throw evaluateUnsupportedError(devServerUrl);
    }
    throw new CommandError(
      'RUNTIME_TREE_FAILED',
      [
        `Could not read the app's component tree (dev server ${devServerUrl}).`,
        `Why: ${error instanceof Error ? error.message : String(error)}`,
        `How: make sure the app is open and connected to the dev server, then run this command again. "npx exagent status" says whether an app is attached.`,
      ].join('\n')
    );
  }

  if (result.exceptionText) {
    // The walk itself raised inside the app, which is this CLI's bug or a fiber shape it has never
    // met — not something the caller can fix by passing a different flag.
    throw new CommandError(
      'RUNTIME_TREE_FAILED',
      [
        `Reading the app's component tree threw inside the app (dev server ${devServerUrl}).`,
        `Why: ${result.exceptionText}`,
        `How: this is a walk over React's own fibers, so a throw here means the app's React is a shape this command has not met. Report it with the React and React Native versions from "npx exagent status --json".`,
      ].join('\n')
    );
  }

  const answer = result.value as RawAnswer | undefined;
  if (answer == null || typeof answer !== 'object' || typeof answer.supported !== 'boolean') {
    throw new CommandError(
      'RUNTIME_TREE_FAILED',
      [
        `The app answered the component-tree walk with something this command cannot read (dev server ${devServerUrl}).`,
        `Why: the expression returns one object with a "supported" flag, and this answer has none.`,
        `How: check that the connected target is the app rather than another page, with "npx exagent status --json".`,
      ].join('\n')
    );
  }
  if (!answer.supported) {
    throw treeUnsupportedError(devServerUrl, answer.reason ?? null);
  }
  return answer;
}

/**
 * The runtime answered and carries no React DevTools hook.
 *
 * Its own error rather than an empty tree, because the two need opposite readings: an empty tree
 * says "this screen has nothing on it", and this says "I could not look at all".
 */
function treeUnsupportedError(devServerUrl: string, reason: string | null): CommandError {
  const error = new CommandError(
    'RUNTIME_TREE_UNSUPPORTED',
    [
      `The app connected to ${devServerUrl} has no React DevTools hook, so its component tree cannot be read.`,
      `Why: ${
        reason === 'no-get-fiber-roots'
          ? '__REACT_DEVTOOLS_GLOBAL_HOOK__ is installed and carries no getFiberRoots, so no renderer registered with it'
          : 'the app has no __REACT_DEVTOOLS_GLOBAL_HOOK__ at all'
      }. These commands walk React's own fiber tree through that hook — a development bundle installs it, and a production bundle is expected not to.`,
      `How: open the app from a development bundle: "npx exagent dev" serves one, and "npx exagent runtime:reload" puts a running app back onto it. "npx exagent runtime:eval" still evaluates JavaScript in this runtime, which is how to read the app's state without the tree.`,
    ].join('\n')
  );
  error.suggestedCommand = 'npx exagent runtime:eval "typeof __REACT_DEVTOOLS_GLOBAL_HOOK__"';
  return error;
}

/** What the app said, given the shape it promised. Unknown fields are dropped, never guessed at. */
function nodesOf(answer: RawAnswer, key: string): TreeNodeJson[] {
  const value = answer[key];
  return Array.isArray(value) ? (value as TreeNodeJson[]) : [];
}

/** Walk the app's component tree and print what is on the screen. */
export async function runtimeTreeAsync(
  options: RuntimeTreeOptions,
  context: RuntimeContext = {}
): Promise<number> {
  const { devServerUrl, client } = await openAppAsync(options, context);
  const answer = await askAppAsync(
    client,
    buildTreeExpression({
      full: options.full,
      allScreens: options.allScreens,
      testID: options.testID,
      maxNodes: options.maxNodes,
    }),
    devServerUrl
  );

  const matched = Number(answer.matched ?? 0);
  // A screen with nothing interactive on it is a report; a testID that matched nothing is a
  // question about the app that was answered "no".
  const ok = options.testID == null || matched > 0;
  const report: RuntimeTreeJson = {
    devServerUrl,
    testID: options.testID,
    focusedScreen: (answer.focusedScreen as string | null) ?? null,
    screensSeen: Array.isArray(answer.screensSeen) ? (answer.screensSeen as string[]) : [],
    allScreens: options.allScreens,
    projection: options.full ? 'full' : 'interactive',
    fibersWalked: Number(answer.fibersWalked ?? 0),
    nodes: nodesOf(answer, 'nodes'),
    nodeCount: Number(answer.nodeCount ?? 0),
    truncated: answer.truncated === true,
    maxNodes: options.maxNodes,
    matched,
    matches: Array.isArray(answer.matches) ? (answer.matches as TreeMatchJson[]) : [],
    ok,
    untrusted: UNTRUSTED_TREE_FIELDS,
  };

  event('runtime_tree', {
    devServerUrl,
    testID: report.testID,
    focusedScreen: report.focusedScreen,
    screensSeen: report.screensSeen.length,
    projection: report.projection,
    allScreens: report.allScreens,
    nodeCount: report.nodeCount,
    truncated: report.truncated,
    matched: report.matched,
  });

  if (options.json) {
    Log.log(JSON.stringify(report, null, 2));
  } else {
    Log.log(formatTree(report));
  }

  if (!ok) {
    Log.error(
      [
        `No element carrying the testID ${options.testID} is on ${
          report.allScreens || report.focusedScreen == null ? 'any mounted screen' : `the focused screen (${report.focusedScreen})`
        } (dev server ${devServerUrl}).`,
        `Why: this matches the testID prop as written in the app's JSX, so an element that carries no testID cannot be found by one.${
          report.allScreens || report.focusedScreen == null
            ? ''
            : ' An app keeps its other screens mounted, and --all-screens looks at those too.'
        }`,
        `How: run "npx exagent runtime:tree" for the testIDs this screen is carrying.`,
      ].join('\n')
    );
    return EXIT_OUTCOME_FAILED;
  }
  return EXIT_OK;
}

/** Read the interactive projection, for the two walks `--verify` compares. */
async function snapshotAsync(
  client: CdpClient,
  devServerUrl: string,
  options: { allScreens: boolean; maxNodes: number }
): Promise<TreeNodeJson[]> {
  const answer = await askAppAsync(
    client,
    buildSnapshotExpression({ allScreens: options.allScreens, maxNodes: options.maxNodes }),
    devServerUrl
  );
  return nodesOf(answer, 'nodes');
}

function delayAsync(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** The fields a tap and a type report in common, read off one answer. */
function callFieldsOf(answer: RawAnswer, devServerUrl: string, options: { allScreens: boolean }) {
  return {
    devServerUrl,
    testID: String(answer.testID ?? ''),
    matched: Number(answer.matched ?? 0),
    index: (answer.index as number | null) ?? null,
    candidates: Array.isArray(answer.candidates)
      ? (answer.candidates as RuntimeTapJson['candidates'])
      : [],
    component: (answer.component as string | null) ?? null,
    screen: (answer.screen as string | null) ?? null,
    focusedScreen: (answer.focusedScreen as string | null) ?? null,
    screensSeen: Array.isArray(answer.screensSeen) ? (answer.screensSeen as string[]) : [],
    allScreens: options.allScreens,
    groupSize: (answer.groupSize as number | null) ?? null,
    handler: (answer.handler as string | null) ?? null,
    handlerOn: (answer.handlerOn as string | null) ?? null,
    handlerOutsideMatch: (answer.handlerOutsideMatch as boolean | null) ?? null,
    disabled: (answer.disabled as boolean | null) ?? null,
    disabledOn: (answer.disabledOn as string | null) ?? null,
    disabledComponent: (answer.disabledComponent as string | null) ?? null,
    forced: answer.forced === true,
    called: answer.called === true,
    threw: (answer.threw as RuntimeTapJson['threw']) ?? null,
    reason: (answer.reason as string | null) ?? null,
    untrusted: UNTRUSTED_CALL_FIELDS,
  };
}

/** Tap the element carrying a testID, by calling the `onPress` the app wrote. */
export async function runtimeTapAsync(
  options: RuntimeTapOptions,
  context: RuntimeContext = {}
): Promise<number> {
  const { devServerUrl, client } = await openAppAsync(options, context);

  // Before the tap, because "what changed" needs both halves and only the first one can be read
  // before the call happens.
  const before = options.verify
    ? await snapshotAsync(client, devServerUrl, options)
    : null;

  const answer = await askAppAsync(
    client,
    buildTapExpression({
      testID: options.testID,
      index: options.index,
      allScreens: options.allScreens,
      force: options.force,
    }),
    devServerUrl
  );

  const fields = callFieldsOf(answer, devServerUrl, options);
  const ok = fields.called && fields.threw == null && fields.reason == null;

  // Only a call that was made has an effect to look for. A refusal walked nothing, so a second
  // snapshot would report the app's own churn as though this command had caused it.
  let verify: RuntimeTapJson['verify'] = null;
  if (before != null && fields.called) {
    await delayAsync(VERIFY_SETTLE_MS);
    const after = await snapshotAsync(client, devServerUrl, options);
    verify = diffSnapshots(before, after, VERIFY_SETTLE_MS);
  }

  const report: RuntimeTapJson = { ...fields, ok, verify };

  event('runtime_tap', {
    devServerUrl,
    testID: report.testID,
    matched: report.matched,
    index: report.index,
    handlerOn: report.handlerOn,
    handlerOutsideMatch: report.handlerOutsideMatch,
    disabled: report.disabled,
    forced: report.forced,
    called: report.called,
    threw: report.threw != null,
    reason: report.reason,
    verified: verify != null,
    changed: verify == null ? null : verify.changed,
  });

  if (options.json) {
    Log.log(JSON.stringify(report, null, 2));
  } else {
    Log.log(formatTap(report));
  }

  if (!ok) {
    const failure = explainTapFailure(report);
    Log.error(failure.message);
    Log.warn(`Try: ${failure.suggestedCommand}`);
    return EXIT_OUTCOME_FAILED;
  }
  return EXIT_OK;
}

/** Type into the element carrying a testID, by calling the `onChangeText` the app wrote. */
export async function runtimeTypeAsync(
  options: RuntimeTypeOptions,
  context: RuntimeContext = {}
): Promise<number> {
  const { devServerUrl, client } = await openAppAsync(options, context);
  const answer = await askAppAsync(
    client,
    buildTypeExpression({
      testID: options.testID,
      index: options.index,
      allScreens: options.allScreens,
      force: options.force,
      text: options.text,
      submit: options.submit,
    }),
    devServerUrl
  );

  const fields = callFieldsOf(answer, devServerUrl, options);
  const ok = fields.called && fields.threw == null && fields.reason == null;
  const report: RuntimeTypeJson = {
    ...fields,
    text: options.text,
    submitted: answer.submitted === true,
    submitHandlerOn: (answer.submitHandlerOn as string | null) ?? null,
    ok,
  };

  event('runtime_type', {
    devServerUrl,
    testID: report.testID,
    matched: report.matched,
    index: report.index,
    handlerOn: report.handlerOn,
    called: report.called,
    submitted: report.submitted,
    threw: report.threw != null,
    reason: report.reason,
  });

  if (options.json) {
    Log.log(JSON.stringify(report, null, 2));
  } else {
    Log.log(formatType(report));
  }

  if (!ok) {
    const failure = explainTypeFailure(report);
    Log.error(failure.message);
    Log.warn(`Try: ${failure.suggestedCommand}`);
    return EXIT_OUTCOME_FAILED;
  }
  return EXIT_OK;
}
