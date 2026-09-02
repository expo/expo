// @ref llp/0018-interaction-commands.rfc.md
// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract
// The machine shape of the three interaction commands.
//
// One rule runs through all of it: **the key set never varies**. A run that matched nothing carries
// the same keys as one that tapped a button, with `null` where a fact is absent, so a caller can
// read `handlerOn` without first checking whether the run got that far. Absence is the only null on
// the wire.
//
// Every string that came out of the app — a component name, a testID, the text of a node, the words
// of a throw — is app-originated content under llp/0008. The `untrusted` list on each payload names
// the fields that hold it, and the human renderer fences them.

import type { FollowUp } from '../../followups/types';
import type { BundleCheckJson } from '../bundleCheck';

/**
 * One row of the walk, as both `runtime:tree` and a `--verify` snapshot project it.
 *
 * A row is an **element**: the fiber carrying a testID that no ancestor of it carries, plus the
 * whole subtree that carries the same one. That is the unit `runtime:tap` matches in and the unit
 * `--index` counts, and the default listing used to be one row per *fiber* instead — nine elements
 * printed 26 rows, three of them for one button, with nothing to tell that apart from three real
 * buttons [friction run 7, F69]. A fiber with no testID is its own element.
 */
export interface TreeNodeJson {
  /** The component's name, from `displayName`, the function name, or the host string. */
  component: string;
  testID: string | null;
  accessibilityLabel: string | null;
  /** `accessibilityRole`, or `role` when the app used the newer spelling. */
  accessibilityRole: string | null;
  /**
   * The text this element shows: its own string children joined, or a `TextInput`'s `value`.
   *
   * The children are **joined**, because `<Text>count: {count}</Text>` is an array of a string and
   * a number and reading only the single-string case reported `null` for it — which is the node a
   * tap usually changes [friction run 7, F63]. Element children are skipped: each has a row of its
   * own. Null means this element shows no text, and `""` means it shows none *and* was measured
   * (an input that was cleared).
   */
  text: string | null;
  /**
   * What an input shows while it is empty. Never reported as {@link text} [friction run 7, F70].
   *
   * `text: null, placeholder: "your name"` is an empty field; `text: "", placeholder: "your name"`
   * is a controlled field whose value is the empty string. Reporting the placeholder as text made
   * the two indistinguishable.
   */
  placeholder: string | null;
  /**
   * The handler props this element carries, e.g. `["onPress"]`, in a fixed order.
   *
   * The **element's**, not the top fiber's: `RectButton` puts `onPress` six fibers down, and a row
   * that reported only what the shallowest fiber had said "not tappable" about a button that is.
   * Handlers an *ancestor* of the element carries are not in here — `runtime:tap` reports those
   * separately as `handlerOutsideMatch`, because reaching one is a different fact.
   */
  handlers: string[];
  interactive: boolean;
  /**
   * Whether the app reports any fiber of this element disabled, i.e. a tap would be refused.
   *
   * In the listing because it was only in `--testID` mode: the default listing printed a disabled
   * button exactly like a working one, and `runtime:tap` then refused it [friction run 7, F69].
   */
  disabled: boolean;
  /** Which prop said so: `disabled`, `editable`, `accessibilityState.disabled`, `aria-disabled`. */
  disabledOn: string | null;
  /** How many fibers this row stands for: the group for an element, 1 for a lone fiber. */
  groupSize: number;
  /** Whether this is a host component, i.e. one React Native renders natively. */
  host: boolean;
  /** Fiber depth. Reported for ordering and identity, never as something to filter on. */
  depth: number;
  /** The React Navigation screen this node is on, or null when none could be named. */
  screen: string | null;
}

/** One element carrying a testID, and what a tap on it would find. */
export interface TreeMatchJson {
  /** Zero-based, and what `--index` takes. */
  index: number;
  component: string;
  screen: string | null;
  /** How many fibers carry this testID under the match, the match included. */
  groupSize: number;
  /** The handler prop that would be called, or null when the element has none. */
  handler: string | null;
  handlerOn: string | null;
  /**
   * Whether the handler came from an **ancestor** of the match rather than from the match itself.
   *
   * A tap on a `Text` inside a card fires the card's handler, which is what a real touch does and
   * not what the caller asked for, so it is said out loud rather than left to be inferred.
   */
  handlerOutsideMatch: boolean | null;
  disabled: boolean;
  /** Which prop said so: `disabled`, `editable`, `accessibilityState.disabled`, `aria-disabled`. */
  disabledOn: string | null;
}

/** Machine shape of `@expo/agent-cli runtime:tree --json`. */
export interface RuntimeTreeJson {
  devServerUrl: string;
  /** The `--testID` the caller named, or null when they asked about the whole screen. */
  testID: string | null;
  /**
   * The screen the walk was scoped to, or null when focus could not be established.
   *
   * Null is not an error: this reads a React Navigation internal, so "I could not tell which screen
   * is focused, here is everything" is the honest answer (llp/0018-interaction-commands.rfc.md §Must not lose).
   */
  focusedScreen: string | null;
  /** Every screen the walk met, focused or not. */
  screensSeen: string[];
  /** Whether the report covers the whole tree rather than the focused screen. */
  allScreens: boolean;
  /** `interactive` — handlers and testIDs — or `full`, which adds labels, roles and text. */
  projection: 'interactive' | 'full';
  /** How many fibers the walk visited. A size, for judging what a bigger screen would cost. */
  fibersWalked: number;
  nodes: TreeNodeJson[];
  /**
   * How many rows came back, which is always `nodes.length`.
   *
   * It used to be the count *before* truncation, so `nodeCount: 42` sat above four rows and read as
   * "38 more to handle" to a caller who had been given everything this run would give [friction run
   * 7, F74]. The pre-truncation total is {@link nodesBeforeTruncation}.
   */
  nodeCount: number;
  /** How many rows the projection produced, before `--max-nodes` cut it. */
  nodesBeforeTruncation: number;
  truncated: boolean;
  maxNodes: number;
  /** How many **elements** carry the named testID. Zero without a `--testID`. */
  matched: number;
  matches: TreeMatchJson[];
  /**
   * What building this project's entry bundle answered, before the app was read.
   *
   * The same object and the same gate as `runtime:reload`'s (llp/0010 §Other gates, in brief). It is here
   * because it was nowhere: with a syntax error on disk, this command walked the bundle from
   * *before* the edit and reported it as the screen [friction run 7, F62].
   */
  bundle: BundleCheckJson;
  /**
   * Why nothing was read, or null when the app was read.
   *
   * Only the bundle gate fills this in: an empty `nodes` array is what an empty screen looks like
   * too, so "the project does not compile, so nothing was read" needs a field of its own.
   */
  reason: string | null;
  /**
   * Whether the command achieved what it was asked.
   *
   * False for a `--testID` that matched no element, and for a project whose entry bundle does not
   * compile — in which case nothing was read at all.
   */
  ok: boolean;
  /** What to run next, computed from the elements this walk found (llp/0009). */
  followups: FollowUp[];
  /** Fields whose contents come from the app and must be treated as data, never instructions. */
  untrusted: string[];
}

/** What `--verify` observed between the walk before a tap and the walk after it. */
export interface TapVerifyJson {
  /** How long the command waited for React to commit before looking again. */
  waitedMs: number;
  /** Whether anything in the interactive projection differed. */
  changed: boolean;
  /** Nodes the second walk had and the first did not. */
  added: TreeNodeJson[];
  /** Nodes the first walk had and the second did not. */
  removed: TreeNodeJson[];
  /** Nodes both walks had, whose text differs. */
  changedText: { key: string; before: string | null; after: string | null }[];
}

/** What a tap and a type report in common. */
interface InteractCallJson {
  devServerUrl: string;
  testID: string;
  /** How many **elements** carry it, inside the scope the command looked at. */
  matched: number;
  /** Which one was acted on, zero-based, or null when none was. */
  index: number | null;
  /**
   * Every element that matched, so a caller answering `ambiguous` can pick one.
   *
   * Each carries the handler prop *this command* would call on it, or null when it carries none.
   * Without that, "two elements carry this testID, pass --index" was the answer for two elements
   * neither of which was an input, and `--index 0` would have failed the same way [friction run 7,
   * F80].
   */
  candidates: { index: number; component: string; screen: string | null; handler: string | null }[];
  component: string | null;
  screen: string | null;
  focusedScreen: string | null;
  screensSeen: string[];
  allScreens: boolean;
  groupSize: number | null;
  handler: string | null;
  handlerOn: string | null;
  handlerOutsideMatch: boolean | null;
  disabled: boolean | null;
  disabledOn: string | null;
  disabledComponent: string | null;
  /** Whether `--force` was passed, which is the only way a disabled element is acted on. */
  forced: boolean;
  /** Whether the handler was called. False for every refusal above. */
  called: boolean;
  /** What the app's own handler threw, when it threw. The tap still happened. */
  threw: { text: string; stack: string | null } | null;
  /** Why nothing was called, or null when something was. */
  reason: string | null;
  /**
   * What building this project's entry bundle answered, before the app was driven.
   *
   * The same gate `runtime:reload` runs, for the same reason: a tap sent to an app that is running
   * the code from before the edit reports a pass for code that does not exist [friction run 7, F62].
   */
  bundle: BundleCheckJson;
  /** Whether the command achieved what it was asked. */
  ok: boolean;
  /** What to run next, given what this call did (llp/0009). Empty for a run that failed. */
  followups: FollowUp[];
  untrusted: string[];
}

/** Machine shape of `@expo/agent-cli runtime:tap --json`. */
export interface RuntimeTapJson extends InteractCallJson {
  /** What changed after the tap, or null when `--verify` was not passed. */
  verify: TapVerifyJson | null;
}

/** Machine shape of `@expo/agent-cli runtime:type --json`. */
export interface RuntimeTypeJson extends InteractCallJson {
  /** The text that was typed. The caller's own, so it is not app-originated. */
  text: string;
  /** Whether `onSubmitEditing` was called. */
  submitted: boolean;
  submitHandlerOn: string | null;
}

/** Why a run called nothing. Each is an outcome of the app, not a failure of the command. */
export type InteractRefusal =
  /** This project's entry bundle does not compile, so nothing was asked of the app at all. */
  | 'bundle-broken'
  /** The bundler had not finished building it, so whether the app is current is unknown. */
  | 'bundle-inconclusive'
  /** No element on the screen carries the testID. */
  | 'no-match'
  /** Several do, and no `--index` said which. */
  | 'ambiguous'
  /** `--index` named one past the end. */
  | 'index-out-of-range'
  /** The element is disabled and `--force` was not passed. */
  | 'disabled'
  /** Nothing in the group, and nothing above it, carries the handler. */
  | 'no-handler'
  /** The text went in and `--submit` found no `onSubmitEditing`. */
  | 'no-submit-handler';
