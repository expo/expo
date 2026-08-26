// @ref llp/0008-guardrails.rfc.md §Untrusted content
// @ref llp/0014-interaction-spike.notes.md
// Rendering for the interaction commands, and the diff `--verify` reports.
//
// Everything these commands print about the app came *from* the app: a component name is whatever
// the developer called their component, a testID is a string in their JSX, and the text of a node is
// whatever is on the screen — which may be a message an attacker typed into it. All of it is fenced
// in untrusted markers, so an agent reading the terminal can tell app data from command output.
//
// The failure explanations are the other half. Every refusal here is an outcome of the app rather
// than a mistake of the caller, so each one says what, why, and the command that recovers it
// (llp/0006 §Errors are prompts) — the recovery is a paste, never a re-read.

import { wrapUntrustedAppOutput } from '../untrusted';
import type {
  RuntimeTapJson,
  RuntimeTreeJson,
  RuntimeTypeJson,
  TapVerifyJson,
  TreeMatchJson,
  TreeNodeJson,
} from './types';

/** Fields of a tree report that hold app-originated content. */
export const UNTRUSTED_TREE_FIELDS = ['nodes', 'matches', 'focusedScreen', 'screensSeen'];

/** Fields of a tap or type report that hold app-originated content. */
export const UNTRUSTED_CALL_FIELDS = [
  'component',
  'handlerOn',
  'disabledComponent',
  'candidates',
  'focusedScreen',
  'screensSeen',
  'threw',
  'verify',
];

/** A testID that a shell passes through as one word, so it needs no quoting on a command line. */
const PLAIN_TESTID = /^[\w.:@/-]+$/;

/**
 * A testID as it goes onto a suggested command line.
 *
 * Quoted only when it has to be. These commands print their suggestions *inside* a sentence that is
 * itself quoted, so an unconditional `JSON.stringify` produced
 * `run "npx exagent runtime:tree --testID "note-list"" for …` [observed — live, 2026-08-26], which
 * is three levels of quote for a string that needed none.
 */
function quoted(testID: string): string {
  return PLAIN_TESTID.test(testID) ? testID : JSON.stringify(testID);
}

/** One sentence naming what the walk was scoped to, which is never left implicit. */
function scopeLine(report: {
  allScreens: boolean;
  focusedScreen: string | null;
  screensSeen: string[];
}): string {
  if (report.allScreens) {
    return `Scope: every screen that is mounted (--all-screens), which is ${
      report.screensSeen.length || 'an unknown number of'
    } screen(s). An app keeps the screens you are not looking at mounted, so this includes elements the user cannot see.`;
  }
  if (report.focusedScreen == null) {
    return `Scope: the whole tree, because which screen is focused could not be determined — this reads a React Navigation internal, and the app either does not use one or does not expose it. Elements below may be on screens the user is not looking at.`;
  }
  return `Scope: the focused screen. Pass --all-screens for the whole tree.`;
}

/** One node as a line of the human report. */
function nodeLine(node: TreeNodeJson): string {
  const parts = [node.component];
  if (node.testID != null) {
    parts.push(`testID=${node.testID}`);
  }
  if (node.handlers.length) {
    parts.push(node.handlers.join(','));
  }
  if (node.accessibilityRole != null) {
    parts.push(`role=${node.accessibilityRole}`);
  }
  if (node.accessibilityLabel != null) {
    parts.push(`label=${node.accessibilityLabel}`);
  }
  if (node.text != null) {
    parts.push(`text=${JSON.stringify(node.text)}`);
  }
  if (node.screen != null) {
    parts.push(`screen=${node.screen}`);
  }
  return `  ${parts.join('  ')}`;
}

/** One matched element as a line, which is what a tap on it would do without doing it. */
function matchLine(match: TreeMatchJson): string {
  const handler =
    match.handler == null
      ? 'no handler — a tap would find nothing to call'
      : `${match.handler} on ${match.handlerOn}${
          match.handlerOutsideMatch ? ' (an ANCESTOR of this element, not the element itself)' : ''
        }`;
  const disabled = match.disabled ? `, disabled (${match.disabledOn}) — a tap would be refused` : '';
  return `  [${match.index}] ${match.component}, ${match.groupSize} fiber(s)${
    match.screen == null ? '' : `, screen ${match.screen}`
  }: ${handler}${disabled}`;
}

/** The human report of `exagent runtime:tree`. */
export function formatTree(report: RuntimeTreeJson): string {
  const header: string[] = [];
  if (report.testID == null) {
    header.push(
      `Walked ${report.fibersWalked} fibers of the app (dev server ${report.devServerUrl}) and kept ${report.nodeCount} node(s), ${report.projection} projection.`
    );
  } else {
    header.push(
      `${report.matched} element(s) carry the testID (dev server ${report.devServerUrl}).`
    );
  }
  header.push(scopeLine(report));
  if (report.truncated) {
    header.push(
      `Truncated: ${report.nodeCount} node(s) matched and the first ${report.maxNodes} are below. Raise --max-nodes, or narrow with --testID.`
    );
  }
  if (report.projection === 'interactive' && report.testID == null) {
    header.push(
      `Only nodes with a handler or a testID are listed. Pass --all for labels, roles and text as well.`
    );
  }

  const body: string[] = [];
  if (report.matches.length) {
    body.push(`Elements carrying ${report.testID}:`, ...report.matches.map(matchLine), '');
  }
  if (report.nodes.length) {
    body.push(...report.nodes.map(nodeLine));
  } else if (report.testID == null) {
    body.push(
      `  (nothing) — no node on this screen carries a handler or a testID. An app with no testIDs cannot be driven by testID; add them, or read the whole projection with --all.`
    );
  } else {
    body.push(`  (nothing)`);
  }

  return [...header, wrapUntrustedAppOutput(body.join('\n'))].join('\n');
}

/** The line that says what an interaction found, for both tap and type. */
function foundLine(report: RuntimeTapJson | RuntimeTypeJson): string {
  const where = report.screen == null ? '' : ` on screen ${report.screen}`;
  const outside = report.handlerOutsideMatch
    ? ` — which is an ANCESTOR of the matched element, not the element itself, so this is the handler a real touch would reach rather than the one you named`
    : '';
  return `Matched ${report.component}${where}, ${report.groupSize} fiber(s), and called ${report.handler} on ${report.handlerOn}${outside}.`;
}

/** The caveats every interaction carries, printed where the caller is, not in a footnote. */
const CALL_CAVEAT =
  'This called the prop, not the screen: there was no touch, no press timing and no gesture recognition, and the handler was given a synthetic event whose coordinates are zero.';

/** The human report of `exagent runtime:tap`. */
export function formatTap(report: RuntimeTapJson): string {
  if (!report.called) {
    return [
      `Nothing was tapped (dev server ${report.devServerUrl}).`,
      scopeLine(report),
      wrapUntrustedAppOutput(candidateBlock(report)),
    ].join('\n');
  }

  const lines = [
    report.threw
      ? `Tapped ${report.testID}, and the app's own handler threw (dev server ${report.devServerUrl}).`
      : `Tapped ${report.testID} (dev server ${report.devServerUrl}).`,
  ];
  if (report.forced && report.disabled) {
    lines.push(
      `Forced: the app reports this element disabled (${report.disabledOn} on ${report.disabledComponent}), so a user could not have pressed it.`
    );
  }
  lines.push(CALL_CAVEAT);

  const body = [foundLine(report)];
  if (report.threw) {
    body.push('', report.threw.text, ...(report.threw.stack ? [report.threw.stack] : []));
  }
  if (report.verify) {
    body.push('', ...verifyLines(report.verify));
  }

  return [...lines, wrapUntrustedAppOutput(body.join('\n'))].join('\n');
}

/** The human report of `exagent runtime:type`. */
export function formatType(report: RuntimeTypeJson): string {
  if (!report.called) {
    return [
      `Nothing was typed (dev server ${report.devServerUrl}).`,
      scopeLine(report),
      wrapUntrustedAppOutput(candidateBlock(report)),
    ].join('\n');
  }

  const lines = [
    report.threw
      ? `Typed ${JSON.stringify(report.text)} into ${report.testID}, and the app's own handler threw (dev server ${report.devServerUrl}).`
      : `Typed ${JSON.stringify(report.text)} into ${report.testID} (dev server ${report.devServerUrl}).`,
  ];
  if (report.submitted) {
    lines.push(`Submitted: onSubmitEditing was called on ${report.submitHandlerOn} after the text.`);
  } else if (report.reason === 'no-submit-handler') {
    lines.push(
      `Not submitted: --submit was passed and no fiber of this element carries onSubmitEditing. The text is in.`
    );
  }
  lines.push(
    `${CALL_CAVEAT} The input was never focused, and no keystroke was delivered — the app's onChangeText ran with this string.`
  );

  const body = [foundLine(report)];
  if (report.threw) {
    body.push('', report.threw.text, ...(report.threw.stack ? [report.threw.stack] : []));
  }
  return [...lines, wrapUntrustedAppOutput(body.join('\n'))].join('\n');
}

/** What the app carries under this testID, for a run that acted on none of it. */
function candidateBlock(report: RuntimeTapJson | RuntimeTypeJson): string {
  if (!report.candidates.length) {
    return `  (no element carries ${report.testID})`;
  }
  return [
    `Elements carrying ${report.testID}:`,
    ...report.candidates.map(
      (candidate) =>
        `  [${candidate.index}] ${candidate.component}${
          candidate.screen == null ? '' : `, screen ${candidate.screen}`
        }`
    ),
  ].join('\n');
}

/** What `--verify` saw, as lines of the report. */
function verifyLines(verify: TapVerifyJson): string[] {
  if (!verify.changed) {
    return [
      `Verified after ${verify.waitedMs}ms: nothing in the interactive projection changed. The handler ran; whatever it did is not visible in the component tree — it may have been a network call, a navigation this walk cannot see, or nothing at all.`,
    ];
  }
  const lines = [`Verified after ${verify.waitedMs}ms, and the screen changed:`];
  for (const node of verify.added) {
    lines.push(`  + ${nodeLine(node).trim()}`);
  }
  for (const node of verify.removed) {
    lines.push(`  - ${nodeLine(node).trim()}`);
  }
  for (const change of verify.changedText) {
    lines.push(`  ~ ${change.key}: ${JSON.stringify(change.before)} -> ${JSON.stringify(change.after)}`);
  }
  return lines;
}

/** What to print on stderr, and what to run next, for an outcome that failed. */
export interface InteractFailure {
  message: string;
  suggestedCommand: string;
}

/** The line that offers the whole tree to a run scoped to one screen. */
function allScreensClause(report: RuntimeTapJson | RuntimeTypeJson): string {
  if (report.allScreens) {
    return ` The whole tree was searched, so this testID is not mounted anywhere.`;
  }
  if (report.focusedScreen == null) {
    return ` The whole tree was searched — focus could not be determined — so this testID is not mounted anywhere.`;
  }
  return ` Only the focused screen (${report.focusedScreen}) was searched: an app keeps its other screens mounted, and --all-screens searches those too.`;
}

/** What, why and how for a `runtime:tap` that called nothing, or whose handler threw. */
export function explainTapFailure(report: RuntimeTapJson): InteractFailure {
  return explainFailure(report, 'runtime:tap', 'onPress', `npx exagent runtime:tap ${quoted(report.testID)}`);
}

/** What, why and how for a `runtime:type` that called nothing, or whose handler threw. */
export function explainTypeFailure(report: RuntimeTypeJson): InteractFailure {
  const failure = explainFailure(
    report,
    'runtime:type',
    'onChangeText',
    `npx exagent runtime:type ${JSON.stringify(report.text)} --testID ${quoted(report.testID)}`
  );
  if (report.reason === 'no-submit-handler') {
    return {
      message: [
        `--submit found no onSubmitEditing to call on ${report.testID}, so nothing was submitted (dev server ${report.devServerUrl}).`,
        `Why: the text did go in — onChangeText ran on ${report.handlerOn} — and no fiber of this element carries onSubmitEditing, so there is no submit for this command to make.`,
        `How: if the app submits from a button, tap that instead. Run "npx exagent runtime:tree --testID ${quoted(report.testID)}" for what this element does carry.`,
      ].join('\n'),
      suggestedCommand: `npx exagent runtime:tree --testID ${quoted(report.testID)}`,
    };
  }
  return failure;
}

/** The shared explanation, which differs between the two commands only in what it names. */
function explainFailure(
  report: RuntimeTapJson | RuntimeTypeJson,
  command: string,
  handlerProp: string,
  rerun: string
): InteractFailure {
  const tree = `npx exagent runtime:tree --testID ${quoted(report.testID)}`;
  const verb = command === 'runtime:tap' ? 'tapped' : 'typed into';

  switch (report.reason) {
    case 'no-match':
      return {
        message: [
          `No element carrying the testID ${report.testID} was found, so nothing was ${verb} (dev server ${report.devServerUrl}).`,
          `Why: this walks the app's own component tree and matches on the testID prop as written in the JSX, so an element with no testID cannot be addressed at all.${allScreensClause(report)}`,
          `How: run "npx exagent runtime:tree" for the testIDs this screen is carrying${report.allScreens ? '' : ', or "npx exagent runtime:tree --all-screens" for every mounted screen'}. If the element has no testID, add one.`,
        ].join('\n'),
        suggestedCommand: 'npx exagent runtime:tree',
      };
    case 'ambiguous':
      return {
        message: [
          `${report.matched} different elements carry the testID ${report.testID}, so nothing was ${verb} (dev server ${report.devServerUrl}).`,
          `Why: these are ${report.matched} separate elements, not one element spread over several fibers — a list row rendered many times is the usual reason — and acting on the first would be a guess about which one you meant.`,
          `How: pass --index to pick one, from 0 to ${report.matched - 1}. Run "${tree}" to see what each of them is.`,
        ].join('\n'),
        suggestedCommand: `${rerun} --index 0`,
      };
    case 'index-out-of-range':
      return {
        message: [
          `--index named an element that is not there: ${report.matched} element(s) carry the testID ${report.testID}, so nothing was ${verb} (dev server ${report.devServerUrl}).`,
          `Why: the index is zero-based and counts elements, not fibers, so the valid values are 0 to ${report.matched - 1}.`,
          `How: pass --index in that range, or leave it out${report.matched === 1 ? ', since there is only one element to act on' : ''}. Run "${tree}" to see them.`,
        ].join('\n'),
        suggestedCommand: tree,
      };
    case 'disabled':
      return {
        message: [
          `The element carrying ${report.testID} is disabled, so nothing was ${verb} (dev server ${report.devServerUrl}).`,
          `Why: the app sets ${report.disabledOn} on its ${report.disabledComponent}. React Native disables the interaction at the responder level, which this never goes through — so calling the handler would run code a user cannot reach, and report a pass for something that cannot happen.`,
          `How: make the element usable and run this again, or pass --force to call the handler anyway. A --force run says in its report that the element was disabled.`,
        ].join('\n'),
        suggestedCommand: `${rerun} --force`,
      };
    case 'no-handler':
      return {
        message: [
          `The element carrying ${report.testID} has no ${handlerProp}, so nothing was ${verb} (dev server ${report.devServerUrl}).`,
          `Why: no fiber of this element carries ${handlerProp}, and neither does any of its ancestors — ${report.component ?? 'the element'} is not something this command can drive.`,
          `How: run "${tree}" for what this element does carry, or "npx exagent runtime:tree" for the elements on this screen that have a handler.`,
        ].join('\n'),
        suggestedCommand: tree,
      };
    default:
      break;
  }

  if (report.threw) {
    return {
      message: [
        `The app's own handler threw when ${report.testID} was ${verb} (dev server ${report.devServerUrl}).`,
        `Why: the call was made — ${report.handler} ran on ${report.handlerOn} — and the app's code raised. The exception is in the report above, fenced as app output.`,
        `How: fix the handler, then "npx exagent runtime:reload" so the app runs the fixed code, and run this again. "npx exagent runtime:errors" collects anything else the app reports.`,
      ].join('\n'),
      suggestedCommand: 'npx exagent runtime:reload',
    };
  }

  return {
    message: `Nothing was ${verb} for the testID ${report.testID} (dev server ${report.devServerUrl}).`,
    suggestedCommand: tree,
  };
}

/**
 * What changed between the walk before a tap and the walk after it.
 *
 * Nodes are keyed by their testID, or by their component name when they have none, plus their
 * position among nodes with the same key — so two list rows with one testID are two nodes rather
 * than one node whose text changed twice.
 */
export function diffSnapshots(
  before: TreeNodeJson[],
  after: TreeNodeJson[],
  waitedMs: number
): TapVerifyJson {
  const keyed = (nodes: TreeNodeJson[]): Map<string, TreeNodeJson> => {
    const seen = new Map<string, number>();
    const out = new Map<string, TreeNodeJson>();
    for (const node of nodes) {
      const base = node.testID ?? `@${node.component}`;
      const ordinal = seen.get(base) ?? 0;
      seen.set(base, ordinal + 1);
      out.set(ordinal === 0 ? base : `${base}#${ordinal}`, node);
    }
    return out;
  };

  const first = keyed(before);
  const second = keyed(after);
  const added: TreeNodeJson[] = [];
  const removed: TreeNodeJson[] = [];
  const changedText: { key: string; before: string | null; after: string | null }[] = [];

  for (const [key, node] of second) {
    const was = first.get(key);
    if (!was) {
      added.push(node);
    } else if (was.text !== node.text) {
      changedText.push({ key, before: was.text, after: node.text });
    }
  }
  for (const [key, node] of first) {
    if (!second.has(key)) {
      removed.push(node);
    }
  }

  return {
    waitedMs,
    changed: added.length > 0 || removed.length > 0 || changedText.length > 0,
    added,
    removed,
    changedText,
  };
}
