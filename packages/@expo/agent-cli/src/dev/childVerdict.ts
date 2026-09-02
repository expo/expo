// @ref llp/0021-honest-reports.rfc.md §The rules
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

import { appReachedDevice } from './buildEvidence';

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

/**
 * Which half of its plan the detached child is in.
 *
 * @ref llp/0004-smart-start-and-project-state.rfc.md §Daemonization
 * **F125.** The dev-server lock is taken by the wrapper at the *start* of its dev-server step, and
 * for `expo run:ios` or `expo run:android` that step is one subprocess that builds, installs and
 * only then serves. So the lock answers a second in, publishing a port nothing is listening on for
 * the next ten minutes — and the parent reported `The dev server started on http://127.0.0.1:8081
 * (pid 29996)` for a run that had started no dev server at all
 * [observed — wave 29, `evidence/10-dev-detach-android.json`].
 *
 * "The lock is held" and "a dev server is listening" are two facts, and this is the second one, read
 * off the same channel as the child's verdict rather than out of a second one: the child's log holds
 * the plan it printed before it ran anything.
 */
export interface DetachedChildPhase {
  /**
   * `building` while the plan's dev-server step is still compiling, `serving` otherwise.
   *
   * `serving` is the answer whenever nothing says otherwise — a log with no plan in it, and a plan
   * whose dev-server step is a plain `expo start`. Guessing `building` would put a sentence about a
   * compiler into the report of a dev server that never had one.
   */
  phase: 'building' | 'serving';
  /** The plan's dev-server step, as it was printed (`expo run:android`), or null for no plan. */
  step: string | null;
  /**
   * Whether that step also asks the Expo CLI to open the app on a device.
   *
   * @ref llp/0021-honest-reports.rfc.md §The rules — **F140.** The dev server and
   * the app-opening are one subprocess, and the opening is the half that can end it: `expo start
   * --ios` drives Simulator.app through AppleScript, and a macOS Automation refusal reaches the
   * Expo CLI as an **unhandled rejection** — `AppleDeviceManager.activateWindowAsync` is called and
   * not awaited [reference — `@expo/cli` `src/start/platforms/PlatformManager.ts`], so it lands
   * whenever it lands and kills the process. Measured 215ms, 252ms and 263ms after `/status` first
   * answered [observed — 2026-08-28, three runs against `friction/run9/livecheck`].
   *
   * So a run whose step carries this has risky work still outstanding when the bundler answers, and
   * {@link DevDetachResultJson.ready} is a claim about a moment that may not survive the exit.
   */
  opensPlatform: boolean;
}

/**
 * One numbered row of the plan table `formatStartPlan` prints: `  2. expo run:android  ~minutes`.
 *
 * The command runs to the end of the run of two-or-more spaces that separates it from the time
 * class, which is how that table is laid out — the columns are padded, so a single space is inside
 * an argument and two are between columns.
 */
const PLAN_STEP_ROW = /^\s*\d+\.\s+((?:expo|eas)(?:\s\S+)*?)(?:\s{2,}|\s*$)/;

/** The plan steps that start a dev server, which is when the lock is taken (`devAsync.ts`). */
const DEV_SERVER_COMMANDS = ['start', 'run:ios', 'run:android'];

/** The dev-server steps that build the app first, and so hold the lock while a compiler runs. */
const BUILDING_COMMANDS = ['run:ios', 'run:android'];

/**
 * The `expo start` flags that make the CLI open the app on a device as well as serve it.
 *
 * The short forms are the Expo CLI's own (`-i`, `-a`, `-w`), and the plan never emits them — but the
 * plan appends whatever the caller typed after its own arguments (`src/dev/forwardedArgs.ts`), so
 * they reach the step table exactly as typed.
 */
const PLATFORM_OPEN_FLAGS = ['--ios', '-i', '--android', '-a', '--web', '-w'];

/**
 * Whether a dev-server step also opens the app on a device.
 *
 * Pure, and exported for the test table, because it is the whole of the F140 decision: which runs
 * have work outstanding that can kill the dev server after it has answered `/status`.
 *
 * `run:ios` and `run:android` always do — launching the app is the last thing they do, and they
 * drive the same device tools. A plain `expo start` opens nothing until it is asked to.
 *
 * @param step the step as the plan table printed it, e.g. `expo start --go --ios --port 9201`.
 */
export function stepOpensPlatform(step: string): boolean {
  const [, command, ...rest] = step.trim().split(/\s+/);
  if (command == null) {
    return false;
  }
  if (BUILDING_COMMANDS.includes(command)) {
    return true;
  }
  return command === 'start' && rest.some((argument) => PLATFORM_OPEN_FLAGS.includes(argument));
}

/**
 * Read the plan out of the child's log and say which half of it is running.
 *
 * Pure over the lines, like {@link parseDetachedChildVerdict}, and reading the same two formats
 * this CLI owns: the plan table of `src/plan/format.ts`, and the install marker of
 * `./buildEvidence.ts` — the one that already decides whether a `run:*` step got its app onto a
 * device (F121). Together they answer the only question the parent has: is the compiler still
 * running, or is what follows it.
 *
 * @param rawLines the child's log, ANSI stripped, oldest first.
 */
export function parseDetachedChildPhase(rawLines: readonly string[]): DetachedChildPhase {
  const lines = rawLines.flatMap((line) => line.split('\n'));

  // The **last** dev-server step of the plan, which is the one the lock belongs to: a plan is a
  // list run in order, and only its last step serves.
  let step: string | null = null;
  for (const line of lines) {
    const command = PLAN_STEP_ROW.exec(line)?.[1]?.trim();
    if (command && DEV_SERVER_COMMANDS.includes(command.split(/\s+/)[1] ?? '')) {
      step = command;
    }
  }
  const opensPlatform = step != null && stepOpensPlatform(step);
  if (step == null || !BUILDING_COMMANDS.includes(step.split(/\s+/)[1] ?? '')) {
    return { phase: 'serving', step, opensPlatform };
  }

  // The install is what says the compiler finished: it is the next thing `expo run:*` does, and it
  // is the marker F121 already reads for exactly that reason. After it, the same step is starting a
  // dev server, and a bundler that has not answered yet is about the wait rather than about a build.
  return {
    phase: appReachedDevice(lines.join('\n')) ? 'serving' : 'building',
    step,
    opensPlatform,
  };
}
