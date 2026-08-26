// @ref llp/0015-backend-selection-and-config.rfc.md §The selection
// Which of the two build backends a plan uses, as one pure function over four facts: what the
// caller typed, what the project's config says, what host this is, and what the toolchain probe
// found. No I/O, so the whole matrix is a table in a unit test.

import type { NativePlatform } from '../plan/types';
import type { BuildBackend } from '../settings/types';
import { localTool, EAS_WHERE, LOCAL_WHERE } from './runsOn';
import type { RunsOn } from './runsOn';
import type { ToolchainProbe } from './types';

/** What decided where the build runs, in precedence order. */
export type BackendSource =
  /** A flag on this command line. Highest, because it is the most recent thing anyone said. */
  | 'flag'
  /** The project's `exagent` config. */
  | 'config'
  /** This host cannot have the toolchain at all, whatever anyone installs. */
  | 'host'
  /** The toolchain probe found the tool missing on a host that could have it. */
  | 'toolchain'
  /** Nothing pushed the build anywhere, so it runs where builds run: here. */
  | 'default';

/** Where a plan's build runs, and the sentence that says why. */
export interface BuildBackendChoice {
  runsOn: RunsOn;
  source: BackendSource;
  /**
   * One sentence, in the form the plan prints under `WHY`.
   *
   * Written here rather than by each reader, so `--plan`, `status` and the follow-ups say the
   * same thing about the same decision.
   */
  why: string;
  /**
   * The chosen backend cannot work on this host, and something said so anyway.
   *
   * Only ever true for an explicit `local` — a flag or a config key that asked to build here on a
   * host that cannot. The choice still stands, because the caller may know something this CLI
   * does not; what changes is that the plan says out loud that it is going to fail.
   */
  doomed: boolean;
}

export interface SelectBuildBackendInput {
  platform: NativePlatform;
  /** `process.platform`, passed in so the table is testable for hosts this test is not running on. */
  hostPlatform: NodeJS.Platform;
  /** What a flag on this command line asked for, or null when none did. */
  requested: BuildBackend | null;
  /** What the project's config asked for, for this platform, or null when it says nothing. */
  configured: BuildBackend | null;
  /** What the probe found, or null when nothing probed this machine. */
  probe: ToolchainProbe | null;
}

/**
 * Pick the backend, and say what picked it.
 *
 * The order is the contract: **an explicit flag beats the config, the config beats detection**.
 * Detection only ever pushes a build *to* the cloud, and only on a machine that has been shown it
 * cannot do the build itself — a probe that established nothing (`unknown`) leaves the build here,
 * because routing a caller to a queue over a toolchain nobody could reach is worse than the local
 * plan they asked for.
 */
export function selectBuildBackend({
  platform,
  hostPlatform,
  requested,
  configured,
  probe,
}: SelectBuildBackendInput): BuildBackendChoice {
  const impossible = probe?.impossible === true;
  const tool = localTool(platform);

  if (requested) {
    return {
      runsOn: requested,
      source: 'flag',
      why:
        requested === 'eas'
          ? `Building ${EAS_WHERE}: --eas was passed on the command line.`
          : `Building ${LOCAL_WHERE}: --local was passed on the command line${impossible ? `, and this host cannot build for ${platform} at all — ${probe?.detail}` : ''}.`,
      doomed: requested === 'local' && impossible,
    };
  }

  if (configured) {
    return {
      runsOn: configured,
      source: 'config',
      why:
        configured === 'eas'
          ? `Building ${EAS_WHERE}, per exagent config.`
          : `Building ${LOCAL_WHERE}, per exagent config${impossible ? `, and this host cannot build for ${platform} at all — ${probe?.detail}` : ''}.`,
      doomed: configured === 'local' && impossible,
    };
  }

  if (impossible) {
    return {
      runsOn: 'eas',
      source: 'host',
      // The host is the whole reason, so the host is what the sentence leads with.
      why: `Building ${EAS_WHERE}: this host runs ${hostPlatform} and a ${platform} build needs ${tool}, which does not exist for it. No install here would change that.`,
      doomed: false,
    };
  }

  if (probe?.status === 'missing') {
    return {
      runsOn: 'eas',
      source: 'toolchain',
      why: `Building ${EAS_WHERE}: this machine does not have ${tool} — ${probe.detail} Install it to build here instead.`,
      doomed: false,
    };
  }

  return {
    runsOn: 'local',
    source: 'default',
    why: localWhy(probe, tool),
    doomed: false,
  };
}

/** Why the build stays here, per what the probe managed to establish. */
function localWhy(probe: ToolchainProbe | null, tool: string): string {
  if (probe?.status === 'present') {
    return `Building ${LOCAL_WHERE}: this machine has ${tool} — ${probe.detail}`;
  }
  if (probe?.status === 'unknown') {
    // Deliberately still local. `unknown` is "the probe could not tell", and a plan that moved to
    // a build queue on the strength of that would be acting on nothing.
    return `Building ${LOCAL_WHERE}: whether this machine has ${tool} could not be established — ${probe.detail} Pass --eas to build in the cloud instead.`;
  }
  return `Building ${LOCAL_WHERE}, which needs ${tool}. Nothing probed this machine for it.`;
}
