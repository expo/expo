// @ref llp/0009-smart-followups.rfc.md §Examples per command — the interaction commands.
// @ref llp/0018-interaction-commands.rfc.md §Eight shipped decisions
//
// What to do after reading a screen, tapping an element, or typing into an input.
//
// These three printed nothing [friction run 7, F75], and of all the commands in the surface they are
// the ones with the most to say: a `runtime:tree` run has just read the testIDs that the next
// command takes as its argument, so the suggestion can name a real one instead of `<testID>`. That
// is the whole of what makes a follow-up worth a line — it is a paste, not a reminder.
//
// One rule runs through all three: never suggest an act the run has already shown would be refused.
// A disabled element is the case that matters, because tapping it is exit 20 by design.

import { PROGRAM_PREFIX } from '../programName';
import { capFollowUps, type FollowUp } from './types';

/** A testID that a shell passes through as one word, so it needs no quoting on a command line. */
const PLAIN_TESTID = /^[\w.:@/-]+$/;

/** A testID as it goes onto a suggested command line, quoted only when it has to be. */
function quoted(testID: string): string {
  return PLAIN_TESTID.test(testID) ? testID : JSON.stringify(testID);
}

/**
 * The platform flag every suggestion carries, when the caller named one.
 *
 * The same reason `reload`'s follow-ups carry it (F54): on a machine with an iOS simulator and an
 * Android emulator on one dev server, a command with no flag reads whichever target the dev server
 * lists first — which is not necessarily the app this run was about.
 */
function platformFlag(platform: 'ios' | 'android' | null): string {
  return platform == null ? '' : ` --${platform}`;
}

/** The text `runtime:type` suggestions type when the caller has typed nothing yet. */
const SAMPLE_TEXT = 'hello';

/** What one row of a `runtime:tree` report says, as the follow-ups read it. */
export interface TreeFollowUpNode {
  testID: string | null;
  handlers: string[];
  disabled: boolean;
}

export interface TreeFollowUpInput {
  /** The rows the walk reported, in the order it reported them. */
  nodes: TreeFollowUpNode[];
  /** The `--testID` the caller named, or null for a whole-screen read. */
  testID: string | null;
  platform: 'ios' | 'android' | null;
}

/** Whether an element is one this command could tap, i.e. suggesting it is not suggesting exit 20. */
function tappable(node: TreeFollowUpNode): boolean {
  return node.testID != null && !node.disabled && node.handlers.includes('onPress');
}

/** Whether an element takes text. */
function typeable(node: TreeFollowUpNode): boolean {
  return node.testID != null && !node.disabled && node.handlers.includes('onChangeText');
}

/**
 * What to do with a screen that has just been read.
 *
 * The ladder is "drive it, then read what happened", and the first rung names an element off this
 * very walk. A screen with no testID on it gets the one suggestion that helps instead: the full
 * projection, which is where the labels and the text are.
 */
export function buildTreeFollowUps({ nodes, testID, platform }: TreeFollowUpInput): FollowUp[] {
  const flag = platformFlag(platform);
  const followups: FollowUp[] = [];

  // A `--testID` run was about one element, so that is the element to drive.
  const target = testID != null ? nodes.find((node) => node.testID === testID) : undefined;
  const toTap =
    testID != null ? (target && tappable(target) ? target : undefined) : nodes.find(tappable);
  const toType =
    testID != null ? (target && typeable(target) ? target : undefined) : nodes.find(typeable);

  if (toTap) {
    followups.push({
      id: 'tap-element',
      command: `${PROGRAM_PREFIX} runtime:tap ${quoted(toTap.testID!)} --verify${flag}`,
      why: 'Calls the onPress this element carries and walks the tree again afterwards, which is the only proof this CLI can offer that the tap did anything.',
    });
  }
  if (toType) {
    followups.push({
      id: 'type-into-input',
      command: `${PROGRAM_PREFIX} runtime:type ${JSON.stringify(SAMPLE_TEXT)} --testID ${quoted(toType.testID!)}${flag}`,
      why: 'This element carries onChangeText, so it is an input: this calls that handler with a string, the way a keyboard would have.',
    });
  }

  if (followups.length === 0) {
    // Nothing on the screen can be driven by testID. The full projection is the next thing to read:
    // it carries the labels, roles and text that say what is there, and an element with no testID
    // cannot be addressed at all.
    return capFollowUps([
      {
        id: 'tree-all',
        command: `${PROGRAM_PREFIX} runtime:tree --all${flag}`,
        why: 'No element here carries a handler this CLI can call, so the full projection — labels, roles and text — is what is left to read. An element with no testID cannot be addressed by one; add them where you want to drive the app.',
      },
    ]);
  }

  followups.push({
    id: 'runtime-errors',
    command: `${PROGRAM_PREFIX} runtime:errors${flag} --fail-on-error`,
    why: 'Reads what the app reported while rendering this screen, which a component tree cannot show.',
  });
  return capFollowUps(followups);
}

export interface TapFollowUpInput {
  testID: string;
  /** Whether `--verify` walked the tree afterwards. */
  verified: boolean;
  /** Whether the diff saw anything, or null when there was no diff. */
  changed: boolean | null;
  platform: 'ios' | 'android' | null;
}

/**
 * What to do after a tap.
 *
 * Which rung leads depends on what the run proved. Without `--verify` nothing was proved at all —
 * the report says a handler was called and never that it worked — so the first suggestion is the
 * same tap with the proof. With `--verify` and no change, the interesting question is whether the
 * handler threw, which the error window answers and the tree cannot.
 */
export function buildTapFollowUps({
  testID,
  verified,
  changed,
  platform,
}: TapFollowUpInput): FollowUp[] {
  const flag = platformFlag(platform);
  const errors: FollowUp = {
    id: 'runtime-errors',
    command: `${PROGRAM_PREFIX} runtime:errors${flag} --fail-on-error`,
    why: 'Reads what the app reported after the call, which is where a handler that threw or a failed request shows up.',
  };

  if (!verified) {
    return capFollowUps([
      {
        id: 'tap-verify',
        command: `${PROGRAM_PREFIX} runtime:tap ${quoted(testID)} --verify${flag}`,
        why: 'This run reports that the handler was called, never that anything happened; --verify walks the tree before and after and reports what changed.',
      },
      errors,
    ]);
  }

  if (changed === false) {
    return capFollowUps([
      errors,
      {
        id: 'read-screen',
        command: `${PROGRAM_PREFIX} runtime:tree --all${flag}`,
        why: 'The diff reads the component tree, so a change to something it does not project — a network call, a native navigation — is invisible to it. The full projection is the wider look.',
      },
    ]);
  }

  return capFollowUps([
    {
      id: 'read-screen',
      command: `${PROGRAM_PREFIX} runtime:tree${flag}`,
      why: 'The screen changed, so this is what it carries now — including any element the tap put there.',
    },
    errors,
  ]);
}

export interface TypeFollowUpInput {
  testID: string;
  /** The text that went in, so the submit suggestion sends the same string. */
  text: string;
  submitted: boolean;
  /** Whether the caller asked for a submit at all. */
  submitRequested: boolean;
  platform: 'ios' | 'android' | null;
}

/**
 * What to do after typing.
 *
 * Text in an input does nothing on its own: something has to consume it. The two ways an app does
 * that are the keyboard's return key and a button, so the ladder is `--submit` first — same command,
 * same string, one flag — and the tree second, because the button that consumes the text is
 * something only a walk of the screen can name.
 */
export function buildTypeFollowUps({
  testID,
  text,
  submitted,
  submitRequested,
  platform,
}: TypeFollowUpInput): FollowUp[] {
  const flag = platformFlag(platform);
  const errors: FollowUp = {
    id: 'runtime-errors',
    command: `${PROGRAM_PREFIX} runtime:errors${flag} --fail-on-error`,
    why: 'Reads what the app reported while it handled the text, which is where a validator that threw shows up.',
  };

  if (submitted) {
    return capFollowUps([
      {
        id: 'read-screen',
        command: `${PROGRAM_PREFIX} runtime:tree${flag}`,
        why: 'The text went in and the submit was made, so this is what the screen carries now.',
      },
      errors,
    ]);
  }

  const followups: FollowUp[] = [];
  if (!submitRequested) {
    followups.push({
      id: 'type-submit',
      command: `${PROGRAM_PREFIX} runtime:type ${JSON.stringify(text)} --testID ${quoted(testID)} --submit${flag}`,
      why: `The text is in the input and nothing has consumed it. --submit calls onSubmitEditing after the text, which is what the keyboard's return key does.`,
    });
  }
  followups.push({
    id: 'find-button',
    command: `${PROGRAM_PREFIX} runtime:tree${flag}`,
    why: 'If the app submits from a button rather than from the keyboard, this names the testIDs on the screen so runtime:tap can press it.',
  });
  followups.push(errors);
  return capFollowUps(followups);
}
