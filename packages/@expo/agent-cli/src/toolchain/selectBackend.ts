// @ref llp/0015-backend-selection-and-config.rfc.md §The selection
// Which of the two build backends a plan uses, as one pure function over four facts: what the
// caller typed, what the project's config says, what host this is, and what the toolchain probe
// found. No I/O, so the whole matrix is a table in a unit test.

import type { NativePlatform } from '../plan/types';
import { PROGRAM_NAME } from '../programName';
import type { BuildBackend } from '../settings/types';
import { localTool, EAS_WHERE, LOCAL_WHERE } from './runsOn';
import type { RunsOn } from './runsOn';
import type { ToolchainProbe } from './types';

/** What decided where the build runs, in precedence order. */
export type BackendSource =
  /** A flag on this command line. Highest, because it is the most recent thing anyone said. */
  | 'flag'
  /** The project's `@expo/agent-cli` config. */
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
   * same thing about the same decision. Always `Building <where>: <because>`.
   */
  why: string;
  /**
   * The cause on its own, without the "building here / in the cloud" half.
   *
   * For a surface that has already said where — the `status` line, which prints the backend as its
   * own labelled column, and would otherwise read `build  eas · Building in the cloud on EAS: …`.
   */
  because: string;
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

  /** The clause an explicit choice gains on a host that cannot honour it. */
  const anyway = impossible
    ? ` This host cannot build for ${platform} at all — ${endSentence(probe?.detail ?? '')}`
    : '';

  if (requested) {
    return choice(
      requested,
      'flag',
      `${requested === 'eas' ? '--eas' : '--local'} was passed on the command line.${anyway}`,
      requested === 'local' && impossible
    );
  }

  if (configured) {
    return choice(
      configured,
      'config',
      `the ${PROGRAM_NAME} config asks for it — "expo.agentCli" in package.json.${anyway}`,
      configured === 'local' && impossible
    );
  }

  if (impossible) {
    // The host is the whole reason, so the host is what the sentence leads with.
    return choice(
      'eas',
      'host',
      `this host runs ${hostPlatform} and a ${platform} build needs ${tool}, which does not exist for it. No install here would change that.`
    );
  }

  if (probe?.status === 'missing') {
    return choice(
      'eas',
      'toolchain',
      `this machine does not have ${tool} — ${endSentence(probe.detail)} Install it to build here instead.`
    );
  }

  return choice('local', 'default', localBecause(probe, tool));
}

/** One choice, with its two spellings kept in step. */
function choice(
  runsOn: RunsOn,
  source: BackendSource,
  because: string,
  doomed: boolean = false
): BuildBackendChoice {
  const where = runsOn === 'eas' ? EAS_WHERE : LOCAL_WHERE;
  return { runsOn, source, because, why: `Building ${where}: ${because}`, doomed };
}

/** Why the build stays here, per what the probe managed to establish. */
function localBecause(probe: ToolchainProbe | null, tool: string): string {
  if (probe?.status === 'present') {
    return `this machine has ${tool} — ${endSentence(probe.detail)}`;
  }
  if (probe?.status === 'unknown') {
    // Deliberately still local. `unknown` is "the probe could not tell", and a plan that moved to
    // a build queue on the strength of that would be acting on nothing.
    return `whether this machine has ${tool} could not be established — ${endSentence(probe.detail)} Pass --eas to build in the cloud instead.`;
  }
  return `it needs ${tool}, and nothing probed this machine for it.`;
}

/**
 * A probe detail with a full stop on it, so the sentence that follows starts as one.
 *
 * The details come from tools rather than from this CLI — `xcode-select` ends its complaint
 * without one — and the reason strings here always continue after them.
 */
function endSentence(detail: string): string {
  const trimmed = detail.trim();
  return !trimmed || /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}
