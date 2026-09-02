// @ref llp/0009-smart-followups.rfc.md §Examples per command — the smoke gate.
//
// `smoke` is the composite, so its follow-ups are the *one* command that answers what it could not.
// The rule that shapes them: never suggest re-running `smoke` for a state a re-run cannot change.
// A bundle that does not compile, another project's dev server and a runtime with no debugger all
// stay exactly as they are however many times the gate runs, and the shipped follow-ups of the
// commands this replaces made that mistake often enough to be worth stating (F41, F48-8).

import { PROGRAM_PREFIX } from '../programName';
import { capFollowUps, type FollowUp } from './types';

export interface SmokeFollowUpInput {
  outcome: 'passed' | 'failed' | 'inconclusive';
  /** Whether a dev server answered at all. */
  devServerFound: boolean;
  /** Whether this run was allowed to start one and boot a device (`--no-start` clears it). */
  bootstrap: boolean;
  /** Whether the dev server proved it serves another project. */
  foreignDevServer: boolean;
  /** Whether the entry bundle was reported broken. */
  bundleBroken: boolean;
  /** The file the bundler stopped on, when it named one. */
  bundleFile: string | null;
  /** Debugger targets attached, or null when the run never read them. */
  appsConnected: number | null;
  /** Whether the runtime answered an evaluation; null when it was never asked. */
  runtimeSupported: boolean | null;
  /**
   * How many records the window caught that the gate fails on.
   *
   * Not "exceptions": React Native reports an uncaught throw through the console path, so what is
   * countable is whether a record carried the error's own stack (llp/0005 §The smoke gate).
   */
  failing: number;
  /** Whether a picture was taken. */
  screenshotTaken: boolean;
  /** Where it is, when one was. */
  screenshotPath: string | null;
  /** The route the run was about, for a re-run that keeps it. */
  route: string | null;
  /**
   * The platform the run was about.
   *
   * Carried into every command these follow-ups suggest, because a re-run that drops it is a
   * different run: `smoke --android` failing suggested `npx @expo/agent-cli smoke`, which on a Mac reads
   * the iOS simulator [friction run 6, F58].
   */
  platform: 'ios' | 'android';
  /**
   * Whether this run was told to use the project's EAS Simulator session.
   *
   * @ref llp/0005-runtime-loop-tools.rfc.md §Cloud simulator
   * The same fact as {@link platform}, for the other half of "which device is this run about", and
   * carried for the same reason: a `smoke --cloud` that found no session used to be answered with
   * `npx @expo/agent-cli navigate / --ios`, which is a ladder off the backend the caller chose onto a
   * booted device the host that reached for the cloud may not have at all. `src/followups/reload.ts`
   * already carried it; this did not.
   */
  cloud: boolean;
}

export function buildSmokeFollowUps(input: SmokeFollowUpInput): FollowUp[] {
  const sameRoute = input.route == null ? '' : ` --route ${input.route}`;
  // Every command that takes `--cloud` keeps it, so a suggested run is the run the caller asked
  // for. The commands that do not take it — `dev --detach`, `typecheck`, `status`,
  // `runtime:errors` — are unaffected: none of them is about a device.
  const onCloud = input.cloud ? ' --cloud' : '';
  // The flag first, so a reader sees what the command is about before what it opens.
  const same = ` --${input.platform}${sameRoute}${onCloud}`;
  const otherPlatform = input.platform === 'android' ? 'ios' : 'android';

  // No dev server. A run that tried to start one and could not needs to see the start fail where
  // its output is visible; a `--no-start` run needs the start it declined to do.
  if (!input.devServerFound) {
    return capFollowUps([
      {
        id: 'dev-detach',
        command: `${PROGRAM_PREFIX} dev --detach --yes --wait-ready`,
        why: input.bootstrap
          ? 'This run tried to start a dev server and could not, so starting one on its own reports what stops it — and leaves it running rather than taking it away again.'
          : 'Nothing answered as a dev server, and --no-start made this run attach-only. That starts one and gives the terminal back.',
      },
      ...(input.bootstrap
        ? []
        : [
            {
              id: 'smoke-start',
              command: `${PROGRAM_PREFIX} smoke${same}`,
              why: 'Runs the same gate without --no-start, which starts the dev server itself when there is none and stops it again afterwards.',
            },
          ]),
    ]);
  }

  // Another project's. Every other suggestion would be about a stranger's app, so it is alone.
  if (input.foreignDevServer) {
    return capFollowUps([
      {
        id: 'smoke-dev-server-url',
        command: `${PROGRAM_PREFIX} status --json`,
        why: 'The dev server that answered was started for another project; this reports which one this project would talk to, so --dev-server-url can name it.',
      },
    ]);
  }

  // A bundle that does not compile is the whole answer: nothing that reads the app can mean
  // anything until the file the bundler named parses.
  if (input.bundleBroken) {
    return capFollowUps([
      {
        id: 'typecheck',
        command: `${PROGRAM_PREFIX} typecheck`,
        why: `The entry bundle does not compile${input.bundleFile ? ` (${input.bundleFile})` : ''}, and the compiler reports every error in the project rather than only the one the bundler stopped on.`,
      },
      {
        id: 'smoke-again',
        command: `${PROGRAM_PREFIX} smoke${same}`,
        why: 'The dev server rebuilds on save, so this is the gate to run again once the file parses.',
      },
    ]);
  }

  if (input.appsConnected === 0) {
    return capFollowUps([
      {
        id: 'navigate',
        command: `${PROGRAM_PREFIX} navigate ${input.route ?? '/'} --${input.platform}${onCloud}`,
        why: input.cloud
          ? "No app is connected to the dev server, and this is what opens one on the project's EAS Simulator session."
          : 'No app is connected to the dev server, and this is what opens one on a booted device.',
      },
      {
        id: 'smoke-again',
        command: `${PROGRAM_PREFIX} smoke${same}`,
        why: 'Runs the same gate once the app is on screen.',
      },
    ]);
  }

  // The runtime that cannot be read. Never a re-run: this never changes for this app on this
  // platform (llp/0005-runtime-loop-tools.rfc.md §Android), and a caller told to look again would loop.
  if (input.runtimeSupported === false) {
    return capFollowUps([
      {
        id: 'runtime-errors',
        // @ref ../runtime/runtimeAsync — friction run 6, F52 and F55. This used to be
        // `npx @expo/agent-cli dev --plan --android` under the sentence "this prints what a development
        // build would take", which is **not what that command prints** for a project Expo Go can
        // still serve: the plan engine answers `expo start --android` for it and only reaches the
        // development-build path when a native module makes Expo Go incompatible
        // (`src/plan/decide.ts`). What does help is the command that can still see the errors.
        command: `${PROGRAM_PREFIX} runtime:errors --android --duration 5s`,
        why: "This runtime reports nothing over the debugger, so that command falls back to the dev server's own log, which does carry the app's errors — with a code frame. It needs a dev server started with --detach.",
      },
      // Not on a cloud run: a session is one device, so "the other platform" is a *different*
      // session — one this CLI was never told about. Naming it with `--cloud` would name a session
      // that does not exist, and naming it without would drop the backend the caller chose, so the
      // honest ladder here is one rung.
      ...(input.cloud
        ? []
        : [
            {
              id: 'smoke-other-platform',
              command: `${PROGRAM_PREFIX} smoke --${otherPlatform}${sameRoute}`,
              why: `Expo Go on ${otherPlatform === 'ios' ? 'iOS' : 'Android'} was measured to answer the debugger, so the same gate has a runtime to read there [observed — 2026-08-25].`,
            },
          ]),
    ]);
  }

  if (input.failing > 0) {
    return capFollowUps([
      {
        id: 'runtime-reload',
        command: `${PROGRAM_PREFIX} runtime:reload --${input.platform}${onCloud}`,
        why: 'An error window is a property of the app’s session and the session outlives a fix, so reload before believing a second reading.',
      },
      {
        id: 'runtime-errors',
        command: `${PROGRAM_PREFIX} runtime:errors --${input.platform} --duration 5s --json`,
        why: 'Prints the same records with their whole symbolicated stacks, which is more than this summary shows.',
      },
      ...(input.screenshotPath
        ? [
            {
              id: 'screenshot',
              command: `open ${input.screenshotPath}`,
              why: 'What the screen looked like while the window was open.',
            },
          ]
        : []),
    ]);
  }

  // A pass. The two things this gate is structurally blind to, in the order llp/0010 §The fourth
  // put them: nothing threw and the bundle transformed, which is not the same as the code being
  // right — the `Spacing.md` finding rendered a screen with `padding: undefined` and every gate
  // green.
  const passed: FollowUp[] = [
    {
      id: 'typecheck',
      command: `${PROGRAM_PREFIX} typecheck`,
      why: 'Nothing threw and the bundle compiled, which is not the same as the types being right — a value that is undefined renders rather than throwing.',
    },
  ];
  if (input.screenshotPath) {
    passed.push({
      id: 'screenshot',
      command: `open ${input.screenshotPath}`,
      why: 'The picture of the screen this run took, which is the half of "does it work" that no exit code answers.',
    });
  } else if (input.outcome !== 'passed') {
    passed.push({
      id: 'smoke-again',
      command: `${PROGRAM_PREFIX} smoke${same}`,
      why: 'Nothing was shown to be wrong and nothing was proved right; this runs the same gate again.',
    });
  }
  if (!input.screenshotTaken && input.outcome === 'passed') {
    passed.push({
      id: 'runtime-errors',
      command: `${PROGRAM_PREFIX} runtime:errors --${input.platform} --duration 10s --fail-on-error`,
      why: 'This window was short and only catches what happens while it is open, so a longer one covers more of the app settling.',
    });
  }
  return capFollowUps(passed);
}
