// @ref llp/0014-interaction-spike.notes.md §Recommendation: GO, with these command shapes
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

/** One node of the walk, as both `runtime:tree` and a `--verify` snapshot project it. */
export interface TreeNodeJson {
  /** The component's name, from `displayName`, the function name, or the host string. */
  component: string;
  testID: string | null;
  accessibilityLabel: string | null;
  /** `accessibilityRole`, or `role` when the app used the newer spelling. */
  accessibilityRole: string | null;
  /** The `children`, `value` or `placeholder` string, whichever the node had. */
  text: string | null;
  /** The handler props this node carries, e.g. `["onPress"]`. */
  handlers: string[];
  interactive: boolean;
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

/** Machine shape of `exagent runtime:tree --json`. */
export interface RuntimeTreeJson {
  devServerUrl: string;
  /** The `--testID` the caller named, or null when they asked about the whole screen. */
  testID: string | null;
  /**
   * The screen the walk was scoped to, or null when focus could not be established.
   *
   * Null is not an error: this reads a React Navigation internal, so "I could not tell which screen
   * is focused, here is everything" is the honest answer (llp/0014 §What the walk sees).
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
  /** How many nodes the projection kept, which is more than `nodes.length` when truncated. */
  nodeCount: number;
  truncated: boolean;
  maxNodes: number;
  /** How many **elements** carry the named testID. Zero without a `--testID`. */
  matched: number;
  matches: TreeMatchJson[];
  /** Whether the command achieved what it was asked. False only for a `--testID` that matched none. */
  ok: boolean;
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
  /** Every element that matched, so a caller answering `ambiguous` can pick one. */
  candidates: { index: number; component: string; screen: string | null }[];
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
  /** Whether the command achieved what it was asked. */
  ok: boolean;
  untrusted: string[];
}

/** Machine shape of `exagent runtime:tap --json`. */
export interface RuntimeTapJson extends InteractCallJson {
  /** What changed after the tap, or null when `--verify` was not passed. */
  verify: TapVerifyJson | null;
}

/** Machine shape of `exagent runtime:type --json`. */
export interface RuntimeTypeJson extends InteractCallJson {
  /** The text that was typed. The caller's own, so it is not app-originated. */
  text: string;
  /** Whether `onSubmitEditing` was called. */
  submitted: boolean;
  submitHandlerOn: string | null;
}

/** Why a run called nothing. Each is an outcome of the app, not a failure of the command. */
export type InteractRefusal =
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
