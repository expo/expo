// @ref llp/0024-cli-ui.rfc.md §The template
// What one command's `--help` is, as data.
//
// Data rather than a formatted string, for one reason: a string can only be printed, and this has
// to be *checked*. `src/help/__tests__/template-test.ts` walks the registry, loads one of these per
// command, and asserts the sections are filled and the examples resolve — which is only possible
// while the parts are still parts. The renderer in `format.ts` turns one of these into the block a
// caller reads, and it is the only thing that decides what a help block looks like.
//
// What is *not* here is the one-line summary: that lives on the registry entry, because the
// top-level listing prints it without loading the command module. One summary, in one place, so the
// name a caller reads in the listing and the name they read in the help cannot say two things.

/** One `$` line of the Examples block, and what running it gets you. */
export interface HelpExample {
  /** The command line as a caller would type it, e.g. `npx @expo/agent-cli dev --detach`. */
  run: string;
  /**
   * One line, in the present tense, saying what comes back.
   *
   * Not a second description of the flags — the Options block above already did that. This answers
   * "what do I have after this returns", which is what decides whether the example is the one to
   * run: `prints the plan and stops` and `starts the dev server` are different enough to pick
   * between without reading either flag.
   */
  gets: string;
}

/**
 * What a `--json` run puts where, and what is in it.
 *
 * @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract — one JSON object on stdout and
 * nothing else. The rule is stated once in the `workflow` topic and repeated per command here, because the
 * part that varies is the keys, and an agent that has to go and find the general rule to learn the
 * specific keys has been sent on a second hop for a fact this block could have given it.
 */
export interface JsonContract {
  /** What is on stdout, e.g. `one object: the plan and what it ran`. */
  stdout: string;
  /** What is on stderr instead, e.g. `progress, warnings, errors`. */
  stderr: string;
  /** The stable top-level keys of the object, in the order the report puts them. */
  keys: string[];
}

/** One command's help, in the order it is printed. */
export interface CommandHelp {
  /**
   * The command as the registry spells it, e.g. `dev:run` or `status`.
   *
   * Asserted against the registry key by the template test, so a spec copied from a neighbour
   * cannot end up documenting the command it was copied from.
   */
  command: string;
  /** The usage line, without the `$`, e.g. `npx @expo/agent-cli dev [options]`. */
  usage: string;
  /** One entry per option, starting at the flag, aligned by hand as the block prints them. */
  options: string[];
  /** Two to four, in the order a caller meets them. */
  examples: HelpExample[];
  /** Registry names a caller typically runs after this one, e.g. `['navigate', 'smoke']`. */
  next: string[];
  /** Present exactly when the Options block offers `--json`. */
  json?: JsonContract;
  /**
   * Facts that change what a caller does and fit nowhere above: the exit codes this command has of
   * its own, a limit worth knowing before running it.
   *
   * Short on purpose. The rationale these blocks used to carry — why the plan picks a build
   * location, what the Hermes runtime does not have — is in the `workflow` topic and in the LLPs,
   * where it can be read once instead of scrolled past on every `--help`.
   */
  notes?: string[];
}
