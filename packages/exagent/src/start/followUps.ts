// @ref llp/0009-smart-followups.rfc.md §Examples per command — `start`.
// The follow-ups of a run that starts a dev server, shared by `exagent start` (the `expo start`
// wrapper) and `exagent dev` (the plan executor). Both know which app the URL is for, which is the
// one fact the builder cannot guess.

import { probeLocalDeviceAsync, type LocalDeviceState } from '../device/localDevice';
import {
  buildStartFollowUps,
  easJsonExistsSync,
  followUpsEnabled,
  resolveDevServerPort,
  resolveExpoGoLanUrl,
  type FollowUp,
} from '../followups';
import type { ToolchainStatus } from '../toolchain/types';

export interface StartTargetHint {
  /** The app the dev server will be opened in runs inside Expo Go. */
  expoGo: boolean;
  /** The run only serves a web bundle, so no phone or simulator is involved. */
  web: boolean;
  /**
   * The port to name in a URL, `null` when none can be vouched for, and absent to read it off the
   * arguments the way `exagent start` does.
   *
   * `null` is the case this exists for: a dev server that never started, or one that never said
   * which port it took. Assuming the default there is how this CLI came to hand an agent the URL
   * of *another project's* dev server [observed — friction run, 2026-08-23].
   */
  port?: number | null;
  /**
   * What a probe established about this machine's ability to build, when one ran.
   *
   * Passed in rather than probed here: nothing on this path may block, and the caller that planned
   * a build has the answer already.
   *
   * @see llp/0004-smart-start-and-project-state.rfc.md §Where a build runs
   */
  localBuild?: ToolchainStatus | null;
}

/** What this builder needs of the resolved options, satisfied by `StartOptions` and `DevOptions`. */
export interface StartFollowUpOptions {
  /** Arguments forwarded to `expo start`, which name the port the dev server listens on. */
  expoArgs: string[];
  /** Whether the follow-ups were asked for at all. */
  followups: boolean;
}

/**
 * How long the local-device probe may hold up the line before the dev server starts.
 *
 * Two subprocesses that answer in tens of milliseconds on a warm machine [observed — 260 ms for a
 * cold `xcrun simctl list devices booted -j`, 2026-08-25]. Expiring costs the ladder its device
 * awareness and nothing else, which is the right trade for a command whose next act is a bundler.
 */
export const DEVICE_PROBE_BUDGET_MS = 1500;

/**
 * The follow-ups of a dev-server run, or an empty list when they are suppressed.
 *
 * Almost everything here is read locally: the port comes from the arguments already resolved, the
 * LAN address from this host's interface list, `eas.json` from one `stat`, and whether the run was
 * asked for a tunnel from the arguments too. The one thing that is not is whether this machine has
 * a device to open the app on, which no file can answer — so it is a bounded probe rather than a
 * blocking one (llp/0009 §Device-aware ladders). The caller is on the last line before the dev
 * server takes over the terminal, and a ladder must never be what holds a start up.
 */
export async function resolveStartFollowUpsAsync(
  projectRoot: string,
  options: StartFollowUpOptions,
  hint: StartTargetHint
): Promise<FollowUp[]> {
  if (!followUpsEnabled(options.followups)) {
    return [];
  }

  const { expoGo, web } = hint;
  const port = 'port' in hint ? hint.port : resolveDevServerPort(options.expoArgs);
  // A web run has no device in it at all, so the probe is not worth even a bounded wait.
  const localDevice = web ? 'unknown' : await probeLocalDeviceWithinBudgetAsync();

  return buildStartFollowUps({
    expoGo,
    web,
    portKnown: port != null,
    lanUrl: expoGo && port != null ? resolveExpoGoLanUrl(port) : null,
    // `localhost` rather than the LAN address: this is the URL on the machine the dev server runs
    // on, and it is what `expo start --web` opens itself.
    webUrl: web && port != null ? `http://localhost:${port}` : null,
    tunnel: requestsTunnel(options.expoArgs),
    localDevice,
    easJson: easJsonExistsSync(projectRoot),
    localBuild: hint.localBuild ?? null,
  });
}

/** The probe, or `unknown` when it takes longer than a dev-server banner may wait. */
async function probeLocalDeviceWithinBudgetAsync(): Promise<LocalDeviceState> {
  let timer: NodeJS.Timeout | undefined;
  const expired = new Promise<'unknown'>((resolve) => {
    timer = setTimeout(() => resolve('unknown'), DEVICE_PROBE_BUDGET_MS);
    timer.unref?.();
  });
  try {
    const probe = await Promise.race([probeLocalDeviceAsync(), expired]);
    return typeof probe === 'string' ? probe : probe.state;
  } catch {
    // The probe does not reject, and a ladder must not be able to fail a start even so.
    return 'unknown';
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Whether the arguments ask `expo start` for a tunnel.
 *
 * Both spellings, because both work: `--tunnel` is the shorthand and `--host tunnel` is the option
 * it sets [observed — `@expo/cli` `src/start/resolveOptions.ts`].
 */
export function requestsTunnel(expoArgs: readonly string[]): boolean {
  const own = expoArgs.slice(0, indexOrEnd(expoArgs, '--'));
  for (const [index, arg] of own.entries()) {
    if (arg === '--tunnel') {
      return true;
    }
    if (arg === '--host' && own[index + 1] === 'tunnel') {
      return true;
    }
    if (arg === '--host=tunnel') {
      return true;
    }
  }
  return false;
}

function indexOrEnd(args: readonly string[], value: string): number {
  const index = args.indexOf(value);
  return index < 0 ? args.length : index;
}
