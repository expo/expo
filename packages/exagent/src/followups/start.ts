// @ref llp/0009-smart-followups.rfc.md §Examples per command — `start` and `start --plan`.
// Pure builders: the caller passes what it already probed, so every branch is unit-testable
// without a dev server, a device, or an EAS account.

import type { ProjectState, StartPlan } from '../project/types';
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
  /** `exp://<lan ip>:<port>`, or null when this host has no LAN address. */
  lanUrl: string | null;
  /** The project has an `eas.json`. */
  easJson: boolean;
}

/**
 * What to do once the dev server is up: put the app on a real phone, read what it throws, and
 * ship it. This is the escalation ladder of llp/0009 §Wider ideas, one rung at a time.
 */
export function buildStartFollowUps(input: StartFollowUpInput): FollowUp[] {
  const followups: FollowUp[] = [];
  if (!input.web) {
    followups.push(realDeviceFollowUp(input));
  }
  followups.push({
    id: 'runtime-errors',
    command: 'npx exagent runtime errors',
    why: 'Reads the errors the running app reports; reproduce the problem while it listens.',
  });
  followups.push(easFollowUp(input.easJson));
  return capFollowUps(followups);
}

/** How to reach the dev server from a phone, which is the one thing a terminal cannot show. */
function realDeviceFollowUp({ expoGo, lanUrl }: StartFollowUpInput): FollowUp {
  if (expoGo && lanUrl) {
    return {
      id: 'real-device',
      command: lanUrl,
      why: 'Open this URL in Expo Go on a phone on the same network to run the app on a real device.',
    };
  }
  return {
    id: 'real-device-tunnel',
    command: 'npx exagent start --tunnel',
    why: expoGo
      ? 'This host reports no LAN address, so a phone reaches the dev server through a tunnel.'
      : 'A development build on a phone needs a dev server URL it can reach; a tunnel serves one from any network.',
  };
}

/** The rung above a device: a cloud build. `eas build` needs an `eas.json` to read a profile. */
function easFollowUp(easJson: boolean): FollowUp {
  return easJson
    ? {
        id: 'eas-build',
        command: 'npx eas build --profile production',
        why: 'eas.json is configured, so a production build can be started in the cloud.',
      }
    : {
        id: 'eas-build-configure',
        command: 'npx eas build:configure',
        why: 'There is no eas.json yet, so EAS Build has to be configured before the first cloud build.',
      };
}

/**
 * What to do with a plan that was printed but not run.
 *
 * The plan itself is the first answer; the rest explains what made it as expensive as it is, which
 * is the "state deltas" idea of llp/0009 §Wider ideas.
 */
export function buildStartPlanFollowUps(plan: StartPlan, state: ProjectState): FollowUp[] {
  const followups: FollowUp[] = [
    {
      id: 'start-smart',
      command: 'npx exagent start --smart',
      why: 'Runs the plan above, emitting it again first so nothing runs unannounced.',
    },
  ];

  if (BUILDING_RULES.includes(plan.rule)) {
    followups.push({
      id: 'build-freshness',
      command: 'npx exagent status',
      why: 'The plan builds because no recorded build matches the current fingerprint; a build made by exagent is recorded, so the next plan skips it.',
    });
  }

  if (!state.expoGo.compatible) {
    followups.push({
      id: 'project-context',
      command: 'npx exagent context',
      why: 'Expo Go cannot run this project; context lists every reason the probe found.',
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
