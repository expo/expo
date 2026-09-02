// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0010
//
// @ref llp/0009-smart-followups.rfc.md §Examples per command — the readiness gate.
// Five outcomes, five different next steps: a wait that expired is worth repeating with a longer
// budget, an entry bundle that does not compile needs the file it names fixed, a ready bundler with
// no app attached needs the app opened, another project's dev server needs a different dev server,
// and a bundle that is loaded and running is ready to be read.
//
// Every one of them is also platform-specific, which is the correction of friction run 4's F40: a
// wait run with `--platform web` used to be told to re-run without it and then to read
// `runtime:errors`, which talks to a *native* runtime over the debugger. A follow-up that silently
// changes platform answers a question the caller did not ask.

import { capFollowUps, type FollowUp } from '../../followups/types';
import { PROGRAM_PREFIX } from '../../programName';
import type { BundleCheckPlatform, BundleCheckResult } from '../../runtime/bundleCheck';

export interface DevWaitFollowUpInput {
  /** The dev server answered `packager-status:running`. */
  ready: boolean;
  /** The wait expired before the answer arrived. */
  timedOut: boolean;
  /** Whether the dev server proved it serves this project; null when it could not be decided. */
  projectRootMatched: boolean | null;
  /** Debugger targets attached to the dev server, or null when they cannot be counted (web). */
  appsConnected: number | null;
  /** The budget the wait was given, in milliseconds. */
  timeoutMs: number;
  /** What building the project's entry bundle answered, or null when it was not attempted. */
  bundle?: BundleCheckResult | null;
  /** Platform the wait was about, so a suggested re-run stays on it. */
  platform?: BundleCheckPlatform;
  /** Dev server that answered, for the web page a reader opens. */
  devServerUrl?: string | null;
  /**
   * Where the app would be opened: on a device this machine has, or on a cloud session.
   *
   * @ref llp/0017-deferred-commands.reference.md §dev:wait. "Open it on the booted simulator or
   * the attached device" is an instruction that cannot work on a machine with neither — which is
   * exactly the machine an EAS Simulator session exists for, and the machine the dogfood run of
   * 2026-08-24 was on. `start` and `status` already aim this rung at the session; this is the third
   * ladder that named a device the caller does not have.
   *
   * Read from `.env.eas-simulator` and not from the service, for the reason the other two are: a
   * suggestion may not spawn a subprocess, and a line naming a dead session costs one command that
   * says so.
   */
  openOn?: 'local' | 'cloud';
}

export function buildDevWaitFollowUps({
  ready,
  timedOut,
  projectRootMatched,
  appsConnected,
  timeoutMs,
  bundle = null,
  platform = 'ios',
  devServerUrl = null,
  openOn = 'local',
}: DevWaitFollowUpInput): FollowUp[] {
  // Carried onto every `dev:wait` this suggests re-running. The default platform is `ios`, so a
  // command without the flag is a command about a different platform than the one that just ran.
  const samePlatform = platform === 'ios' ? '' : ` --platform ${platform}`;

  // The wrong dev server first, whatever else is true: every other suggestion is about a bundle
  // that belongs to another project, so acting on one of those would confirm the wrong thing.
  if (projectRootMatched === false) {
    return capFollowUps([
      {
        id: 'dev-wait-other-project',
        command: `${PROGRAM_PREFIX} dev`,
        why: 'The dev server that answered was started for another project, so start this one and pass --dev-server-url to wait on a specific dev server.',
      },
    ]);
  }

  // Before the timeout, and before everything else that assumes a working app: nothing else is
  // worth doing until the code compiles, and the file that stopped the bundler is the only place
  // to start. The command already printed the message, so the follow-up is the check to re-run.
  if (bundle?.outcome === 'broken') {
    const where = bundle.error?.filename
      ? `${bundle.error.filename}${bundle.error.lineNumber ? `:${bundle.error.lineNumber}` : ''}`
      : 'the file the bundler named';
    return capFollowUps([
      {
        id: 'dev-wait-bundle-broken',
        command: `${PROGRAM_PREFIX} dev:wait${samePlatform}`,
        why: `The dev server is healthy but this project's entry bundle does not compile: fix ${where}, then run this again — the dev server rebuilds on save, so no restart is needed.`,
      },
    ]);
  }

  if (timedOut && !ready) {
    return capFollowUps([
      {
        id: 'dev-wait-longer',
        command: `${PROGRAM_PREFIX} dev:wait --timeout ${timeoutMs * 2}${samePlatform}`,
        why: 'The bundler was still working when the wait expired, and a first bundle of a large app often takes longer than the budget it was given.',
      },
      {
        id: 'dev-wait-status',
        command: `${PROGRAM_PREFIX} status`,
        why: 'Check that the dev server that answered is the one this project started before waiting on it again.',
      },
    ]);
  }

  // The web branch, and the whole of it is what this command *cannot* say. There is no app count
  // to act on and no debugger to read, so the two rungs below — open the app, then read its error
  // window — have no web spelling. What is left is the page itself, and the check that is about
  // the code rather than about any runtime.
  if (ready && platform === 'web') {
    return capFollowUps([
      {
        id: 'dev-wait-web-open',
        command: `open ${devServerUrl ?? 'http://127.0.0.1:8081'}`,
        why: "The web bundle compiles, and that is everything this command can prove for web: a browser running it registers no debugger target, so nothing here can tell you whether a page is open or what it is showing. Open it and look — the browser's own console is the error window.",
      },
      {
        id: 'dev-wait-typecheck',
        command: `${PROGRAM_PREFIX} typecheck`,
        why: 'The bundle compiling is not the code being right: a type error is neither a syntax error nor a throw, so this is the only gate that sees it.',
      },
    ]);
  }

  // The bundle is built and nothing is running it. The old suggestion here was to re-run the same
  // wait, which is the one thing that cannot change the answer: something has to open the app
  // first, and `navigate` is the command that does it — it deep-links the booted simulator or the
  // attached device at this project's dev server. Re-running the gate is the step after that.
  if (ready && appsConnected === 0) {
    return capFollowUps([
      {
        id: 'dev-wait-open-app',
        command: `${PROGRAM_PREFIX} navigate /${openOn === 'cloud' ? ' --cloud' : ''}`,
        why:
          openOn === 'cloud'
            ? 'The bundle is built but no app is attached. This machine has no booted simulator and no attached device, and this project has an EAS Simulator session on record — so this opens the app on that. It needs a tunnelled dev server, and the session bills until "npx eas simulator:stop".'
            : 'The bundle is built but no app is attached, so open it on the booted simulator or the attached device — this is the step nothing else does for you.',
      },
      {
        id: 'dev-wait-require-app',
        command: `${PROGRAM_PREFIX} dev:wait --require-app --timeout ${timeoutMs}${samePlatform}`,
        why: 'Once the app has been opened, this waits for it to attach to the dev server before anything reads it.',
      },
    ]);
  }

  // The edit loop's green state, and the one this list was shortest for. `runtime:errors` answers
  // "does it throw", and the class of bug that survives both this gate and that one is a type
  // error: `padding: Spacing.md` on a constant with no `md` is `undefined` at runtime, so nothing
  // throws and the screen is simply wrong (llp/0009 §Where the typecheck rung goes).
  if (ready) {
    return capFollowUps([
      {
        id: 'dev-wait-runtime-errors',
        command: `${PROGRAM_PREFIX} runtime:errors`,
        why: 'The bundle is loaded in a connected app, so an error window now says whether it is running or red-screening.',
      },
      {
        id: 'dev-wait-typecheck',
        command: `${PROGRAM_PREFIX} typecheck`,
        why: 'The bundle compiling is not the code being right: a type error is neither a syntax error nor a throw, so this is the only gate that sees it.',
      },
    ]);
  }

  return capFollowUps([
    {
      id: 'dev-wait-status',
      command: `${PROGRAM_PREFIX} status`,
      why: 'The dev server answered, but not as an Expo dev server does, so check which server is listening on that port.',
    },
  ]);
}
