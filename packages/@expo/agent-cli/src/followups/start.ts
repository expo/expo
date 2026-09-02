// @ref llp/0009-smart-followups.rfc.md §Examples per command — `start` and `dev --plan`.
// Pure builders: the caller passes what it already probed, so every branch is unit-testable
// without a dev server, a device, or an EAS account.

import type { LocalDeviceState } from '../device/localDevice';
import type { PlanPlatform } from '../plan/types';
import { PROGRAM_NAME, PROGRAM_PREFIX } from '../programName';
import type { ProjectState, StartPlan } from '../project/types';
import { localTool, EAS_REQUIREMENT, EAS_WHERE, LOCAL_WHERE } from '../toolchain/runsOn';
import type { ToolchainStatus } from '../toolchain/types';
import { capFollowUps, type FollowUp } from './types';

/** Where `expo start` listens when the command line names no port. */
export const DEFAULT_DEV_SERVER_PORT = 8081;

/** Plan rules whose plan contains a native build, so recording one makes the next plan cheaper. */
const BUILDING_RULES = ['dev-client-stale', 'bare-stale', 'needs-dev-client'];

export interface StartFollowUpInput {
  /** The app the dev server is opened in runs inside Expo Go, which takes an `exp://` URL. */
  expoGo: boolean;
  /** The run only serves a web bundle, so no phone or simulator is involved. */
  web: boolean;
  /**
   * The URL that points the app at this dev server from a device on the same network, or null.
   *
   * Per application, and they are not interchangeable: `exp://<lan ip>:<port>` is the **Expo Go**
   * form, and a development build takes its own scheme
   * (`<scheme>://expo-development-client/?url=…`). The caller resolves which — it knows whether the
   * run is a `--dev-client` one — so this builder is handed the URL rather than the ingredients.
   */
  lanUrl: string | null;
  /** What opens {@link lanUrl}, for a line that has to say which app it means. */
  lanUrlLabel?: string;
  /**
   * The run was asked for a tunnel, so the dev server's address is a tunnel host.
   *
   * Known from the command line, and it has to be: the tunnel host itself is not known until the
   * dev server has come up, which is seconds after these lines are printed. What it changes is that
   * naming the LAN URL here would be *wrong* rather than merely unhelpful — the whole point of the
   * flag is a device that is not on this network, and `exp://192.168.x.x:8081` is unreachable from
   * one [observed — dogfood, 2026-08-24: a cloud simulator, given exactly that].
   */
  tunnel?: boolean;
  /**
   * Whether this machine has a device to open the app on, when a probe established it.
   *
   * `absent` is the only value that changes the ladder, and it drops the rung that deep-links a
   * local simulator. `unknown` — a probe that could not run — leaves everything as it was.
   *
   * @see src/device/localDevice.ts
   */
  localDevice?: LocalDeviceState;
  /**
   * Whether this project has an EAS Simulator session on record (a `.env.eas-simulator`).
   *
   * The one thing that turns "this machine has no device" back into a command: a session is a
   * device this CLI can drive. Read from a file rather than from the service, because these lines
   * are printed on the last line before a dev server takes over the terminal and a ladder must
   * never be what holds a start up (llp/0009 §Device-aware ladders).
   *
   * @see llp/0005-runtime-loop-tools.rfc.md §Cloud simulator
   */
  cloudSession?: boolean;
  /** `http://localhost:<port>`, the page a browser opens. Null when no port can be vouched for. */
  webUrl?: string | null;
  /**
   * Whether the port of the dev server is known at all.
   *
   * Defaults to true, which is what every caller that reads a port off the command line means.
   * `false` says the dev server never reported one — it did not start, or it walked past the port
   * it was given without saying where it landed — and then no URL may be named for it.
   */
  portKnown?: boolean;
  /** The project has an `eas.json`. */
  easJson: boolean;
  /**
   * Whether this machine can build the app itself, when something established it.
   *
   * `null` is "nobody asked", which is the honest answer for a run that planned no build: the
   * probe costs a subprocess and a dev-server run has no reason to pay for one.
   *
   * @see llp/0004-smart-start-and-project-state.rfc.md §Where a build runs
   */
  localBuild?: ToolchainStatus | null;
}

/**
 * What to do once the dev server is up: put the app on a real phone, read what it throws, and
 * ship it. This is the escalation ladder of llp/0009 §Examples per command, one rung at a time.
 */
export function buildStartFollowUps(input: StartFollowUpInput): FollowUp[] {
  if (input.web) {
    return capFollowUps(webFollowUps(input));
  }

  // @ref llp/0009-smart-followups.rfc.md §Device-aware ladders
  // Normally first, because it is the one step between "the dev server is up" and anything
  // verifiable, and the only one no other command does: a dev server serves a bundle and opens
  // nothing. Left out entirely on a machine with no device, where it is an instruction to run
  // something that cannot work — `simctl` and `adb` drive a *local* simulator or an attached
  // device, and the run that found this had neither [observed — dogfood, 2026-08-24].
  const openApp: FollowUp[] =
    input.localDevice !== 'absent'
      ? [
          {
            id: 'open-app',
            command: `${PROGRAM_PREFIX} navigate /`,
            why: 'The dev server is up but opens nothing, so this deep-links the app onto the booted simulator or the attached device.',
          },
        ]
      : input.cloudSession
        ? // The rung is not dropped, it is aimed elsewhere: this machine has no device and this
          // project has a cloud one on record, which is a device this CLI can drive.
          [
            {
              id: 'open-app-cloud',
              command: `${PROGRAM_PREFIX} navigate / --cloud`,
              why: 'This machine has no booted simulator and no attached device, and this project has an EAS Simulator session on record — so this deep-links the app onto that instead. It needs a tunnelled dev server, and the session bills until "npx eas simulator:stop".',
            },
          ]
        : [];

  return capFollowUps([
    ...openApp,
    realDeviceFollowUp(input),
    {
      id: 'runtime-errors',
      command: `${PROGRAM_PREFIX} runtime:errors`,
      why: 'Reads the errors the running app reports; reproduce the problem while it listens.',
    },
    buildEasBuildFollowUp(input.easJson, input.localBuild ?? null),
  ]);
}

/**
 * The ladder of a web run, which has different rungs.
 *
 * A web run needs no device, so the two steps a native run leads with — deep-link the app, then
 * reach it from a phone — do not exist, and `runtime:errors` has no debugger target to read either:
 * the app is in a browser, not attached to the dev server. What is left is where the site is, how
 * to prove it compiles, and where it ships. The list used to lead with `npx @expo/agent-cli runtime:errors`
 * and `npx eas build:configure` — a cloud *native* build the run did not need — and named neither
 * the URL nor a way to check the bundle [observed — friction run 2, 2026-08-23].
 */
function webFollowUps(input: StartFollowUpInput): FollowUp[] {
  const site: FollowUp = input.webUrl
    ? {
        id: 'web-url',
        command: input.webUrl,
        why: 'Open this URL in a browser to use the app; the dev server serves it and reloads on every edit.',
      }
    : {
        id: 'dev-server-port-unknown',
        command: `${PROGRAM_PREFIX} status --json`,
        why: 'The dev server did not report a port, so no URL can be named for it — status says which dev server this project actually has. Pass --port to decide it up front.',
      };

  return [
    site,
    {
      id: 'web-typecheck',
      command: `${PROGRAM_PREFIX} typecheck`,
      why: "Runs this project's own compiler and exits 20 with the file and line of every error, which is the check the browser tab cannot give you.",
    },
    {
      id: 'deploy-web',
      command: `${PROGRAM_PREFIX} deploy --web`,
      why: 'Exports the web bundle and deploys it to EAS Hosting, which is where a web build ships.',
    },
  ];
}

/** How to reach the dev server from a phone, which is the one thing a terminal cannot show. */
function realDeviceFollowUp({
  expoGo,
  lanUrl,
  lanUrlLabel = 'Expo Go',
  portKnown = true,
  tunnel = false,
  localDevice = 'unknown',
  cloudSession = false,
}: StartFollowUpInput): FollowUp {
  const label = lanUrlLabel;
  const noLocalDevice =
    localDevice !== 'absent'
      ? ''
      : cloudSession
        ? 'This machine has no booted simulator and no attached device; the EAS Simulator session above is what can open the app here. '
        : 'This machine has no booted simulator and no attached device, so nothing here can open the app. ';

  // A tunnelled run first, because it is the case where the LAN URL below would be *wrong* rather
  // than merely one option: the tunnel host is not known until the dev server comes up, seconds
  // after this line is printed, so what is named is the command that reads it back.
  if (tunnel) {
    return {
      id: 'real-device-tunnel',
      command: `${PROGRAM_PREFIX} navigate / --print-url`,
      why: `${noLocalDevice}This run tunnels the dev server, so its address is a tunnel host rather than this machine's — and the tunnel host is only known once it is up. This prints the exp:// link to open on a phone, a cloud simulator, or anywhere else.`,
    };
  }

  if (!portKnown) {
    // Naming a URL here would be a guess about which process holds the default port, and a wrong
    // guess sends a device into another project's app and reports it as success.
    return {
      id: 'dev-server-port-unknown',
      command: `${PROGRAM_PREFIX} status --json`,
      why: 'The dev server did not report a port, so no URL can be named for it — status says which dev server this project actually has. Pass --port to decide it up front.',
    };
  }
  if (lanUrl) {
    return {
      id: 'real-device',
      command: lanUrl,
      why: `${noLocalDevice}Open this URL in ${label} on a phone on the same network to run the app on a real device. A device that is not on this network — a cloud simulator — needs "${PROGRAM_PREFIX} dev --detach --tunnel" instead.`,
    };
  }
  return {
    id: 'real-device-tunnel',
    command: `${PROGRAM_PREFIX} start --tunnel`,
    why: expoGo
      ? `${noLocalDevice}This host reports no LAN address, so a phone reaches the dev server through a tunnel.`
      : `${noLocalDevice}A development build on a phone needs a dev server URL it can reach; a tunnel serves one from any network.`,
  };
}

/**
 * The rung above a device: a build that runs somewhere else.
 *
 * Named as a *cloud* build with what a cloud build asks for, because the alternative it is offered
 * against — `expo run:ios`, `expo run:android` — runs on this machine and asks for something else
 * entirely, and "build" on its own does not say which of the two is meant.
 *
 * When this machine can build locally, the `why` says why the cloud is still worth choosing. That
 * is the reverse of the usual hint and it is the one a developer with a working Xcode actually
 * needs: a local build cannot be handed to anyone, and it is signed with what this machine has.
 *
 * @see llp/0004-smart-start-and-project-state.rfc.md §Where a build runs
 */
export function buildEasBuildFollowUp(
  easJson: boolean,
  localBuild: ToolchainStatus | null = null
): FollowUp {
  const stillWorthIt =
    localBuild === 'present'
      ? ` This machine can do a local build itself; the cloud is still the answer when the build has to be signed with credentials this machine does not hold, or handed to somebody else as a downloadable artifact.`
      : '';

  return easJson
    ? {
        id: 'eas-build',
        command: 'npx eas build --profile production',
        why: `eas.json is configured, so a production build can be started ${EAS_WHERE} — a cloud build, which needs ${EAS_REQUIREMENT} rather than Xcode or the Android SDK ${LOCAL_WHERE}.${stillWorthIt}`,
      }
    : {
        id: 'eas-build-configure',
        command: 'npx eas build:configure',
        why: `There is no eas.json yet, so EAS Build — the cloud build, which needs ${EAS_REQUIREMENT} rather than Xcode or the Android SDK ${LOCAL_WHERE} — has to be configured before the first one.${stillWorthIt}`,
      };
}

/**
 * What to do with a plan that was printed but not run.
 *
 * The plan itself is the first answer; the rest explains what made it as expensive as it is, which
 * is computed from the probes the plan already ran (llp/0009 §The follow-up block).
 */
export function buildStartPlanFollowUps(
  plan: StartPlan,
  state: ProjectState,
  /**
   * The platform flag the caller typed, when they typed one.
   *
   * @ref llp/0005-runtime-loop-tools.rfc.md §navigate — F103.
   * `dev --plan --android` printed `expo start --go --android` and then offered `npx @expo/agent-cli dev`,
   * which on a Mac plans for iOS — so the one follow-up whose whole promise is "runs the plan above"
   * ran a different plan. The *typed* flag rather than the platform the plan settled on, which is
   * the same split `decideStartPlan` keeps: printing a flag nobody typed would claim they asked.
   */
  requestedPlatform?: PlanPlatform
): FollowUp[] {
  const platformFlag = requestedPlatform ? ` --${requestedPlatform}` : '';
  const followups: FollowUp[] = [];

  // @ref llp/0015-backend-selection-and-config.rfc.md §The follow-ups of a chosen backend
  // The plan already took the right route, so this ladder no longer has to offer one. What it has
  // to offer is the thing that route needs and the caller may not have: a cloud build reaches a
  // queue owned by an account, and "not signed in" is a failure that arrives *after* the upload.
  const location = plan.buildLocation;
  if (location?.runsOn === 'eas') {
    followups.push({
      id: 'eas-account',
      command: 'npx eas whoami',
      why: `The plan builds ${EAS_WHERE}, which needs ${EAS_REQUIREMENT} — this says which one this machine is signed in as, before a build is queued under it. "npx eas login" if it is none.`,
    });
  } else if (location?.runsOn === 'local' && location.status === 'missing') {
    // Reached only when a flag or the config asked to build here on a machine that cannot: with
    // nobody asking, detection would have taken the plan to the cloud already. Leading with it is
    // right, because running the plan below stops at the compiler.
    followups.push({
      id: 'eas-build-instead',
      command: location.alternativeCommand!,
      why: `The plan builds ${LOCAL_WHERE} and this machine does not have ${localTool(location.platform)}, so running it stops at the compiler. This builds the same app ${EAS_WHERE} instead, which needs ${EAS_REQUIREMENT}.`,
    });
  }

  followups.push({
    id: 'dev',
    command: `${PROGRAM_PREFIX} dev${platformFlag}`,
    why: 'Runs the plan above, emitting it again first so nothing runs unannounced.',
  });

  if (BUILDING_RULES.includes(plan.rule)) {
    followups.push({
      id: 'build-freshness',
      command: `${PROGRAM_PREFIX} status`,
      why: `The plan builds because no recorded build matches the current fingerprint; a build made by ${PROGRAM_NAME} is recorded, so the next plan skips it.`,
    });
  }

  if (!state.expoGo.compatible) {
    followups.push({
      id: 'project-context',
      command: `${PROGRAM_PREFIX} status --json`,
      why: 'Expo Go cannot run this project; the probe in that report lists every reason.',
    });
  }

  return capFollowUps(followups);
}

/**
 * The port the dev server will listen on, read from the arguments forwarded to `expo start`.
 *
 * An unusable value falls back to the default instead of failing: `expo start` is the command that
 * owns the flag, so it reports a bad port, and a follow-up must never be the thing that stops a
 * start.
 */
export function resolveDevServerPort(expoArgs: string[]): number {
  const value = readPortArgument(expoArgs);
  if (value == null) {
    return DEFAULT_DEV_SERVER_PORT;
  }
  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : DEFAULT_DEV_SERVER_PORT;
}

function readPortArgument(expoArgs: string[]): string | undefined {
  for (const [index, arg] of expoArgs.entries()) {
    if (arg === '--port' || arg === '-p') {
      return expoArgs[index + 1];
    }
    if (arg.startsWith('--port=')) {
      return arg.slice('--port='.length);
    }
  }
  return undefined;
}
