// @ref llp/0018-interaction-commands.rfc.md
// @ref llp/0005-runtime-loop-tools.rfc.md
// The command layer of `runtime:tree`, `runtime:tap` and `runtime:type`.
//
// Each command is one question, sent as one `Runtime.evaluate` through the same `CdpClient` that
// `runtime:eval` uses — the spike proved that path carries this unchanged, wrapper and all
// (llp/0018-interaction-commands.rfc.md). This file does four things and no more: find the app, send the
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
import {
  buildTapFollowUps,
  buildTreeFollowUps,
  buildTypeFollowUps,
  followUpsEnabled,
  reportFollowUps,
  type FollowUp,
} from '../../followups';
import * as Log from '../../log';
import { PROGRAM_PREFIX } from '../../programName';
import { CommandError } from '../../utils/errors';
import {
  bundleToJson,
  checkEntryBundleAsync,
  resolveBundleCheckPlatformsAsync,
  type BundleCheckJson,
  type BundleCheckResult,
} from '../bundleCheck';
import { CdpClient, isMethodNotFoundError, type CdpEvaluateResult } from '../cdpClient';
import { preflightRuntimeAsync, type RuntimeContext } from '../preflight';
import { evaluateUnsupportedError } from '../runtimeAsync';
import {
  buildSnapshotExpression,
  buildTapExpression,
  buildTreeExpression,
  buildTypeExpression,
} from './expression';
import {
  diffSnapshots,
  explainBundleRefusal,
  explainTapFailure,
  explainTypeFailure,
  formatTap,
  formatTree,
  formatType,
  UNTRUSTED_CALL_FIELDS,
  UNTRUSTED_TREE_FIELDS,
} from './format';
import type { RuntimeTapOptions, RuntimeTreeOptions, RuntimeTypeOptions } from './resolveOptions';
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
 * observed at: after the tap the input was empty and the new row was in the list (llp/0018-interaction-commands.rfc.md
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

/**
 * How long the entry bundle check gets before the run stops waiting for the bundler.
 *
 * Fixed rather than a flag, unlike `runtime:reload`'s `--timeout`: that timeout covers the app
 * quitting and coming back, which is tens of seconds, and this covers one build the bundler has
 * usually already done — a warm `.bundle` HEAD answered in under a second live [observed — friction
 * run 7]. A cold first build can take longer than this, and a run that hits that is told the check
 * did not finish rather than that the project is broken.
 */
export const BUNDLE_CHECK_TIMEOUT_MS = 20_000;

/** What all three commands share: the app they drive, and the state of the code it is running. */
interface OpenApp {
  devServerUrl: string;
  client: CdpClient;
  /** The gate's answer. `ok: false` is the one value that stops the command. */
  bundle: BundleCheckJson;
  /** Whether the bundle is broken or undecided, i.e. nothing may be asked of the app. */
  refusal: 'bundle-broken' | 'bundle-inconclusive' | null;
}

/**
 * The dev server, the state of this project's code, and a debugger connection to the app.
 *
 * @ref llp/0018-interaction-commands.rfc.md §Shape of the code — friction run 7, F62.
 *
 * Two gates, in this order, and the order is a decision (llp/0005 §One preflight for the runtime
 * family). **The preflight comes first:** with no app connected there is nothing to read whatever
 * the bundle says, and asking the bundler first spent that gate's whole budget — up to twenty
 * seconds — before the command could say the one thing it knew in a millisecond. It also decided
 * the exit code by an unrelated fact: no app plus a broken bundle was `20`, no app plus a clean
 * bundle was `1`, for one situation.
 *
 * **Then the bundle gate**, whose result is on every payload. These three commands read and drive
 * the bundle the app is *running*: with a syntax error on disk the app is still running the code
 * from before the edit, so the walk describes code that no longer exists — and `runtime:tap
 * --verify` reported `Verified ... the screen changed` for exactly that while `smoke` and
 * `runtime:reload` both refused. It is the same check, the same `bundle` object and the same
 * `--no-bundle-check` override those two use, because it is the same question.
 */
async function openAppAsync(
  options: {
    devServerUrl: string | null;
    platform?: RuntimeTreeOptions['platform'];
    bundleCheck?: boolean;
  },
  context: RuntimeContext
): Promise<OpenApp> {
  const { devServerUrl, targets, deviceIndex } = await preflightRuntimeAsync(
    { need: 'debugger-target', devServerUrl: options.devServerUrl, platform: options.platform },
    context
  );
  const wantBundleCheck = options.bundleCheck !== false;

  let bundle: BundleCheckResult | null = null;
  if (wantBundleCheck) {
    const { platforms } = await resolveBundleCheckPlatformsAsync(options.platform ?? null, targets);
    const results: BundleCheckResult[] = [];
    for (const platform of platforms) {
      results.push(
        await checkEntryBundleAsync(devServerUrl, {
          platform,
          timeoutMs: BUNDLE_CHECK_TIMEOUT_MS,
          projectRoot: context.projectRoot ?? null,
        })
      );
    }
    // A broken bundle decides the run whichever platform it was found on, the way it does for a
    // reload: a project with a `.android.ts` sibling of a broken file compiles for one and not the
    // other, and answering for one of two attached apps is how a red screen went unreported (F53).
    bundle =
      results.find((entry) => entry.outcome === 'broken') ??
      results.find((entry) => entry.outcome === 'timeout') ??
      results[0] ??
      null;
  }
  // `unknown` passes, as it does for `dev:wait` and `runtime:reload`: a dev server that answered
  // nothing this CLI understands has not shown the project to be broken, and refusing there would
  // stop a read that would have worked and name no fix.
  const refusal =
    bundle?.outcome === 'broken'
      ? ('bundle-broken' as const)
      : bundle?.outcome === 'timeout'
        ? ('bundle-inconclusive' as const)
        : null;

  const json = bundleToJson(bundle, { skippedByFlag: !wantBundleCheck });
  if (refusal != null) {
    // No connection is opened: the app is not what this run is about any more.
    return { devServerUrl, client: null as unknown as CdpClient, bundle: json, refusal };
  }

  return {
    devServerUrl,
    client: new CdpClient({ metroUrl: devServerUrl, platform: options.platform, deviceIndex }),
    bundle: json,
    refusal,
  };
}

/** The platform a follow-up carries, which is the one the caller named or none. */
function followUpPlatform(platform: RuntimeTreeOptions['platform']): 'ios' | 'android' | null {
  return platform === 'ios' || platform === 'android' ? platform : null;
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
        `How: make sure the app is open and connected to the dev server, then run this command again. "${PROGRAM_PREFIX} status" says whether an app is attached.`,
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
        `How: this is a walk over React's own fibers, so a throw here means the app's React is a shape this command has not met. Report it with the React and React Native versions from "${PROGRAM_PREFIX} status --json".`,
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
        `How: check that the connected target is the app rather than another page, with "${PROGRAM_PREFIX} status --json".`,
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
      `How: open the app from a development bundle: "${PROGRAM_PREFIX} dev" serves one, and "${PROGRAM_PREFIX} runtime:reload" puts a running app back onto it. "${PROGRAM_PREFIX} runtime:eval" still evaluates JavaScript in this runtime, which is how to read the app's state without the tree.`,
    ].join('\n')
  );
  error.suggestedCommand = `${PROGRAM_PREFIX} runtime:eval "typeof __REACT_DEVTOOLS_GLOBAL_HOOK__"`;
  return error;
}

/** What the app said, given the shape it promised. Unknown fields are dropped, never guessed at. */
function nodesOf(answer: RawAnswer, key: string): TreeNodeJson[] {
  const value = answer[key];
  return Array.isArray(value) ? (value as TreeNodeJson[]) : [];
}

/**
 * Report a run the bundle gate stopped, and hand back the exit code for it.
 *
 * The payload comes first and carries the same keys a run that reached the app does — every fact
 * about the app null, and `bundle` holding the reason (llp/0006 §Output contract). The text mode
 * prints one line rather than an empty listing: a projection of nothing would read as a screen with
 * nothing on it, which is not what happened.
 */
function refuseForBundle(
  report: RuntimeTreeJson | RuntimeTapJson | RuntimeTypeJson,
  { json, what, rerun }: { json: boolean; what: string; rerun: string }
): number {
  if (json) {
    Log.log(JSON.stringify(report, null, 2));
  } else {
    Log.log(
      `Bundle ${report.bundle.ok === false ? 'does not compile' : 'not checked'}${
        report.bundle.platform ? ` · for ${report.bundle.platform}` : ''
      }`
    );
  }
  const failure = explainBundleRefusal(report.bundle, { what, rerun });
  Log.error(failure.message);
  Log.warn(`Try: ${failure.suggestedCommand}`);
  return EXIT_OUTCOME_FAILED;
}

/** The tree payload of a run that never read the app, with every app fact absent. */
function unreadTreeReport(
  options: RuntimeTreeOptions,
  devServerUrl: string,
  bundle: BundleCheckJson,
  refusal: 'bundle-broken' | 'bundle-inconclusive'
): RuntimeTreeJson {
  return {
    devServerUrl,
    testID: options.testID,
    focusedScreen: null,
    screensSeen: [],
    allScreens: options.allScreens,
    projection: options.full ? 'full' : 'interactive',
    fibersWalked: 0,
    nodes: [],
    nodeCount: 0,
    nodesBeforeTruncation: 0,
    truncated: false,
    maxNodes: options.maxNodes,
    matched: 0,
    matches: [],
    bundle,
    // Named on the payload as well as on stderr, so a caller reading JSON does not have to infer
    // "nothing was read" from an empty `nodes` array — which is also what an empty screen looks
    // like (llp/0018 §Shape of the code).
    reason: refusal,
    ok: false,
    followups: [],
    untrusted: UNTRUSTED_TREE_FIELDS,
  };
}

/** Walk the app's component tree and print what is on the screen. */
export async function runtimeTreeAsync(
  options: RuntimeTreeOptions,
  context: RuntimeContext = {}
): Promise<number> {
  const { devServerUrl, client, bundle, refusal } = await openAppAsync(options, context);
  if (refusal != null) {
    return refuseForBundle(unreadTreeReport(options, devServerUrl, bundle, refusal), {
      json: options.json,
      what: 'nothing on the screen was read',
      rerun: `${PROGRAM_PREFIX} runtime:tree`,
    });
  }
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
    nodesBeforeTruncation: Number(answer.nodesBeforeTruncation ?? answer.nodeCount ?? 0),
    truncated: answer.truncated === true,
    maxNodes: options.maxNodes,
    matched,
    matches: Array.isArray(answer.matches) ? (answer.matches as TreeMatchJson[]) : [],
    bundle,
    reason: null,
    ok,
    // A run that answered "no" says what to do in its own refusal, so a follow-up ladder there
    // would be a second answer to the same question (llp/0009 §Examples per command).
    followups:
      ok && followUpsEnabled(options.followups)
        ? buildTreeFollowUps({
            nodes: nodesOf(answer, 'nodes'),
            testID: options.testID,
            platform: followUpPlatform(options.platform),
          })
        : [],
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
          report.allScreens || report.focusedScreen == null
            ? 'any mounted screen'
            : `the focused screen (${report.focusedScreen})`
        } (dev server ${devServerUrl}).`,
        `Why: this matches the testID prop as written in the app's JSX, so an element that carries no testID cannot be found by one.${
          report.allScreens || report.focusedScreen == null
            ? ''
            : ' An app keeps its other screens mounted, and --all-screens looks at those too.'
        }`,
        `How: run "${PROGRAM_PREFIX} runtime:tree" for the testIDs this screen is carrying.`,
      ].join('\n')
    );
    return EXIT_OUTCOME_FAILED;
  }
  reportFollowUps('runtime:tree', report.followups, { json: options.json });
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
function callFieldsOf(
  answer: RawAnswer,
  devServerUrl: string,
  options: { allScreens: boolean },
  bundle: BundleCheckJson
) {
  return {
    devServerUrl,
    bundle,
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

/**
 * The tap or type payload of a run that never reached the app, with every app fact absent.
 *
 * `called: false` and `reason` naming the gate: a caller branching on `reason` reads one field
 * whether the app refused the act or the project refused to compile (llp/0006 §Output contract).
 */
function unreadCallFields(
  options: { testID: string; allScreens: boolean },
  devServerUrl: string,
  bundle: BundleCheckJson,
  refusal: 'bundle-broken' | 'bundle-inconclusive'
) {
  return {
    devServerUrl,
    bundle,
    testID: options.testID,
    matched: 0,
    index: null,
    candidates: [],
    component: null,
    screen: null,
    focusedScreen: null,
    screensSeen: [],
    allScreens: options.allScreens,
    groupSize: null,
    handler: null,
    handlerOn: null,
    handlerOutsideMatch: null,
    disabled: null,
    disabledOn: null,
    disabledComponent: null,
    forced: false,
    called: false,
    threw: null,
    reason: refusal,
    ok: false,
    followups: [] as FollowUp[],
    untrusted: UNTRUSTED_CALL_FIELDS,
  };
}

/** Tap the element carrying a testID, by calling the `onPress` the app wrote. */
export async function runtimeTapAsync(
  options: RuntimeTapOptions,
  context: RuntimeContext = {}
): Promise<number> {
  const { devServerUrl, client, bundle, refusal } = await openAppAsync(options, context);
  if (refusal != null) {
    return refuseForBundle(
      { ...unreadCallFields(options, devServerUrl, bundle, refusal), verify: null },
      {
        json: options.json,
        what: 'nothing was tapped',
        rerun: `${PROGRAM_PREFIX} runtime:tap ${options.testID}`,
      }
    );
  }

  // Before the tap, because "what changed" needs both halves and only the first one can be read
  // before the call happens.
  const before = options.verify ? await snapshotAsync(client, devServerUrl, options) : null;

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

  const fields = callFieldsOf(answer, devServerUrl, options, bundle);
  const ok = fields.called && fields.threw == null && fields.reason == null;

  // Only a call that was made has an effect to look for. A refusal walked nothing, so a second
  // snapshot would report the app's own churn as though this command had caused it.
  let verify: RuntimeTapJson['verify'] = null;
  if (before != null && fields.called) {
    await delayAsync(VERIFY_SETTLE_MS);
    const after = await snapshotAsync(client, devServerUrl, options);
    verify = diffSnapshots(before, after, VERIFY_SETTLE_MS);
  }

  const report: RuntimeTapJson = {
    ...fields,
    ok,
    verify,
    followups:
      ok && followUpsEnabled(options.followups)
        ? buildTapFollowUps({
            testID: fields.testID,
            verified: verify != null,
            changed: verify == null ? null : verify.changed,
            platform: followUpPlatform(options.platform),
          })
        : [],
  };

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
  reportFollowUps('runtime:tap', report.followups, { json: options.json });
  return EXIT_OK;
}

/** Type into the element carrying a testID, by calling the `onChangeText` the app wrote. */
export async function runtimeTypeAsync(
  options: RuntimeTypeOptions,
  context: RuntimeContext = {}
): Promise<number> {
  const { devServerUrl, client, bundle, refusal } = await openAppAsync(options, context);
  if (refusal != null) {
    return refuseForBundle(
      {
        ...unreadCallFields(options, devServerUrl, bundle, refusal),
        text: options.text,
        submitted: false,
        submitHandlerOn: null,
      },
      {
        json: options.json,
        what: 'nothing was typed',
        rerun: `${PROGRAM_PREFIX} runtime:type ${JSON.stringify(options.text)} --testID ${options.testID}`,
      }
    );
  }
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

  const fields = callFieldsOf(answer, devServerUrl, options, bundle);
  const ok = fields.called && fields.threw == null && fields.reason == null;
  const submitted = answer.submitted === true;
  const report: RuntimeTypeJson = {
    ...fields,
    text: options.text,
    submitted,
    submitHandlerOn: (answer.submitHandlerOn as string | null) ?? null,
    ok,
    followups:
      ok && followUpsEnabled(options.followups)
        ? buildTypeFollowUps({
            testID: fields.testID,
            text: options.text,
            submitted,
            submitRequested: options.submit,
            platform: followUpPlatform(options.platform),
          })
        : [],
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
  reportFollowUps('runtime:type', report.followups, { json: options.json });
  return EXIT_OK;
}
