// @ref llp/0009-smart-followups.rfc.md §Examples per command — the smoke gate.
//
// `smoke` is the composite, so its follow-ups are the *one* command that answers what it could not.
// The rule that shapes them: never suggest re-running `smoke` for a state a re-run cannot change.
// A bundle that does not compile, another project's dev server and a runtime with no debugger all
// stay exactly as they are however many times the gate runs, and the shipped follow-ups of the
// commands this replaces made that mistake often enough to be worth stating (F41, F48-8).

import { capFollowUps, type FollowUp } from './types';

export interface SmokeFollowUpInput {
  outcome: 'passed' | 'failed' | 'inconclusive';
  /** Whether a dev server answered at all. */
  devServerFound: boolean;
  /** Whether this run was allowed to start one (`--start`). */
  start: boolean;
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
  /** How many uncaught exceptions the window caught. */
  exceptions: number;
  /** Whether a picture was taken. */
  screenshotTaken: boolean;
  /** Where it is, when one was. */
  screenshotPath: string | null;
  /** The route the run was about, for a re-run that keeps it. */
  route: string | null;
}

export function buildSmokeFollowUps(input: SmokeFollowUpInput): FollowUp[] {
  const sameRoute = input.route == null ? '' : ` --route ${input.route}`;

  // No dev server, and this run was not allowed to start one. The one thing to do is the thing
  // `--start` would have done, spelled as the command that does it without blocking the shell.
  if (!input.devServerFound) {
    return capFollowUps([
      {
        id: 'dev-detach',
        command: 'npx exagent dev --detach --yes --wait-ready',
        why: input.start
          ? 'This run was allowed to start a dev server and could not, so starting one in the foreground shows what stops it.'
          : 'Nothing answered as a dev server, and this run was attach-only. That starts one and gives the terminal back.',
      },
      {
        id: 'smoke-start',
        command: `npx exagent smoke --start${sameRoute}`,
        why: 'Runs the same gate and starts the dev server itself when there is none.',
      },
    ]);
  }

  // Another project's. Every other suggestion would be about a stranger's app, so it is alone.
  if (input.foreignDevServer) {
    return capFollowUps([
      {
        id: 'smoke-dev-server-url',
        command: 'npx exagent status --json',
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
        command: 'npx exagent typecheck',
        why: `The entry bundle does not compile${input.bundleFile ? ` (${input.bundleFile})` : ''}, and the compiler reports every error in the project rather than only the one the bundler stopped on.`,
      },
      {
        id: 'smoke-again',
        command: `npx exagent smoke${sameRoute}`,
        why: 'The dev server rebuilds on save, so this is the gate to run again once the file parses.',
      },
    ]);
  }

  if (input.appsConnected === 0) {
    return capFollowUps([
      {
        id: 'navigate',
        command: `npx exagent navigate ${input.route ?? '/'}`,
        why: 'No app is connected to the dev server, and this is what opens one on a booted device.',
      },
      {
        id: 'smoke-again',
        command: `npx exagent smoke${sameRoute}`,
        why: 'Runs the same gate once the app is on screen.',
      },
    ]);
  }

  // The runtime that cannot be read. Never a re-run: this never changes for this app on this
  // platform (llp/0005 §Android pass), and a caller told to look again would loop.
  if (input.runtimeSupported === false) {
    return capFollowUps([
      {
        id: 'dev-build',
        command: 'npx exagent dev --plan --android',
        why: 'Expo Go for Android ships a JavaScript engine with no Chrome DevTools Protocol debugger, so nothing here can read what the app throws. This prints what a development build would take.',
      },
      {
        id: 'smoke-ios',
        command: `npx exagent smoke --ios${sameRoute}`,
        why: 'Expo Go on iOS carries a debuggable engine, so the same gate answers there.',
      },
    ]);
  }

  if (input.exceptions > 0) {
    return capFollowUps([
      {
        id: 'runtime-reload',
        command: 'npx exagent runtime:reload',
        why: 'An error window is a property of the app’s session and the session outlives a fix, so reload before believing a second reading.',
      },
      {
        id: 'runtime-errors',
        command: 'npx exagent runtime:errors --duration 5s --json',
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
      command: 'npx exagent typecheck',
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
      command: `npx exagent smoke${sameRoute}`,
      why: 'Nothing was shown to be wrong and nothing was proved right; this runs the same gate again.',
    });
  }
  if (!input.screenshotTaken && input.outcome === 'passed') {
    passed.push({
      id: 'runtime-errors',
      command: 'npx exagent runtime:errors --duration 10s --fail-on-error',
      why: 'This window was short and only catches what happens while it is open, so a longer one covers more of the app settling.',
    });
  }
  return capFollowUps(passed);
}
