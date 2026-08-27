// @ref llp/0021-honest-reports.rfc.md §A detached child's own verdict
// What the detached child concluded, read back out of its log.
//
// A detached run has two processes and one caller, and only one of them prints to the caller's
// terminal. When the child fails it does the whole job properly — it classifies the failure, names
// the scenario, and writes the what/why/how — into a file nobody is watching, while the parent that
// *is* being read says `Bundler ready` and exits 0 [observed — friction run 7, F61; live staging,
// S4]. The verdict is not missing. It is in the wrong place.
//
// So this reads it back. The two lines it looks for are written by `logCmdError` and
// `formatNeedsHumanBlock` (`src/utils/errors.ts`), which is a *format of this CLI's own* — the
// round-trip test in `__tests__/childVerdict-test.ts` builds the log out of those functions and
// parses it back, the same way `formatPortMove`/`parsePortMove` are pinned as a pair. The parent's
// report goes silently wrong the moment the two drift.

/** How many lines of the child's log are searched for its verdict. */
export const VERDICT_LOG_LINES = 400;

/** The child's own conclusion about the run it was asked to perform. */
export interface DetachedChildVerdict {
  /**
   * Needs-human scenario id the child named, or null when its failure was not one.
   *
   * Non-null is the strong signal: this line is written by nothing but the needs-human block, and
   * that block is printed only by a process on its way out.
   */
  scenario: string | null;
  /** The child's own message, as it printed it, without the handoff block under it. */
  message: string;
}

/** `NeedsHumanError: <message>` — `Error.toString()` as `Log.exception` prints it. */
const ERROR_LINE = /^([A-Za-z]*Error): (.*)$/;

/** `Needs a human   <scenario>` — the first row of {@link formatNeedsHumanBlock}'s block. */
const NEEDS_HUMAN_ROW = /^Needs a human\s{2,}(\S+)\s*$/;

/** The rest of that block, which the parent re-renders from the registry rather than quoting. */
const HANDOFF_ROW = /^(?:Ask the user|Or set|Try:)\s{2,}?\S/;

/**
 * Read the child's verdict out of its log, or null when the log holds none.
 *
 * Pure over the lines, so every shape is testable without a second process.
 *
 * The **last** error wins. A log is written in order and a dev server prints plenty before it
 * fails; what the caller needs is the one the child stopped on.
 *
 * @param lines the child's log, ANSI stripped, oldest first.
 */
export function parseDetachedChildVerdict(
  rawLines: readonly string[]
): DetachedChildVerdict | null {
  // One element per line, whoever the caller is: a log file read is already split, and an error a
  // test hands over as one multi-line string is the same text.
  const lines = rawLines.flatMap((line) => line.split('\n'));
  let scenario: string | null = null;
  let errorAt = -1;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]!;
    const handoff = NEEDS_HUMAN_ROW.exec(line);
    if (handoff) {
      scenario = handoff[1]!;
      continue;
    }
    if (ERROR_LINE.test(line)) {
      errorAt = index;
    }
  }

  if (scenario == null && errorAt < 0) {
    return null;
  }

  const message = lines
    .slice(errorAt < 0 ? lines.length : errorAt)
    .filter((line) => !NEEDS_HUMAN_ROW.test(line) && !HANDOFF_ROW.test(line))
    .join('\n')
    .trim();

  return { scenario, message };
}
