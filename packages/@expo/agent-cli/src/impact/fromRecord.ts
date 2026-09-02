// @ref llp/0004-smart-start-and-project-state.rfc.md §Status
// @ref llp/0011-impact-and-freshness.rfc.md §Two things called impact
//
// What a change costs, computed from two things `@expo/agent-cli status` already holds: the fingerprint
// its probe took, and the one `.expo/agent-cli-last-build.json` recorded after the last build this
// CLI ran. No subprocess, no network, no second fingerprint run — see `src/project/localDiff.ts`
// for the diff this leans on and why it is a port rather than a spawn.
//
// **This answers `null` where `@expo/agent-cli impact` answers `needs-native-build`, and that is the
// difference between the two commands rather than a disagreement.** `impact` is a *gate*: it has
// to name a class because `--assert` compares against one, and "unknown" cannot be gated on, so
// its rule is the conservative one — undecided means build, which over-plans at worst. `status` is
// a *report*, and every other line of it treats `unknown` as its own answer that is never rounded
// down (`auth`, `device`, the bundler's readiness). A class this command did not establish has no
// business being printed beside ones it did.

import type { LastBuildFingerprint } from '../plan/lastBuild';
import type { NativePlatform } from '../plan/types';
import { PROGRAM_NAME } from '../programName';
import type { FingerprintSource } from '../project/fingerprint';
import { diffFingerprintSourcesLocally } from '../project/localDiff';
import { classifyFingerprintDiff } from './classify';
import type { ChangedFiles, ChangedSource, ImpactClass } from './types';

/** What a change costs, as far as the data already in hand can establish it. */
export interface RecordedImpact {
  /** Null when nothing was established. Never the conservative guess a gate has to make. */
  class: ImpactClass | null;
  /** Whether the native fingerprint moved. Null when it could not be decided. */
  fingerprintChanged: boolean | null;
  /** One sentence: the strongest finding, or why nothing could be decided. */
  reason: string;
  /** How many fingerprint sources moved. Null when no diff was possible. */
  changedCount: number | null;
  /**
   * The per-source list, for a caller that asked for the detail.
   *
   * Always computed — the diff is local, so the list is a by-product — and carried only where it
   * was asked for: `status --json` is deliberately small (it drops the fingerprint's own `sources`
   * for the same reason), and a headline with fifty rows attached is not a headline.
   */
  changedSources: ChangedSource[];
}

/**
 * Classify the working tree against what was recorded for one platform.
 *
 * @param recorded what `.expo/agent-cli-last-build.json` holds for the platform, or null.
 * @param head the fingerprint of the working tree, as the project probe took it.
 */
export function classifyAgainstRecordedBuild(
  platform: NativePlatform,
  recorded: LastBuildFingerprint | null,
  head: { hash: string | null; sources?: FingerprintSource[] | null }
): RecordedImpact {
  if (!head.hash) {
    return undecided(
      null,
      `the working tree could not be fingerprinted, so nothing about this change has been established`
    );
  }
  if (!recorded) {
    // Not "unchanged", and not a class either. `@expo/agent-cli dev` writes this record after a native
    // build it ran; a build made by EAS, by Xcode, or on another machine leaves nothing here.
    return undecided(
      null,
      `no build is recorded for ${platform}, so there is nothing to compare this against — "${PROGRAM_NAME} dev" writes the record after a native build it runs`
    );
  }

  const fingerprintChanged = recorded.hash !== head.hash;

  if (!recorded.sources) {
    return undecided(
      fingerprintChanged,
      `the recorded ${platform} build stored only a hash, so this can say whether the native surface moved and not what moved — the next build recorded by this CLI stores the whole fingerprint`
    );
  }
  if (!head.sources) {
    return undecided(
      fingerprintChanged,
      `the fingerprint CLI returned a hash with no sources, so this can say whether the native surface moved and not what moved`
    );
  }

  const items = diffFingerprintSourcesLocally(recorded.sources, head.sources);
  const classified = classifyFingerprintDiff(items);
  return {
    // An empty diff is `js-only` and that is decided, not a fallback: the native surface was
    // compared source by source and did not move.
    class: classified.class,
    fingerprintChanged,
    reason:
      classified.reasons[0] ??
      `the native fingerprint is unchanged, so nothing here needs the app built again`,
    changedCount: classified.changedSources.length,
    changedSources: classified.changedSources,
  };
}

function undecided(fingerprintChanged: boolean | null, reason: string): RecordedImpact {
  return { class: null, fingerprintChanged, reason, changedCount: null, changedSources: [] };
}

/**
 * How long the changed-file read may take.
 *
 * `git status --porcelain` measured 20–240 ms live — the low end on a small project, the high end
 * in this monorepo [observed — 2026-08-26]. The budget is for a repository far larger than either;
 * expiring costs the refinement below and never the report, which then keeps the fingerprint's own
 * `js-only`.
 */
export const CHANGED_FILES_TIMEOUT_MS = 3000;

/** What the file-level view adds when the fingerprint had nothing left to say. */
export interface FileRefinement {
  /** `js-only` or `dev-client-compatible` — never stronger; the fingerprint owns that end. */
  class: ImpactClass;
  /** One sentence naming what has to restart, or saying that nothing does. */
  reason: string;
  counts: ChangedFiles;
}

/**
 * Split "Fast Refresh picks it up" from "restart Metro", for a native surface that did not move.
 *
 * The fingerprint cannot tell these apart, and without this the headline's three-class vocabulary
 * is really a two-class one: a `metro.config.js` edit would be reported `js-only` and the reader
 * would reload forever waiting for a change the dev server read once at start-up. That is a
 * *wrong* headline rather than a coarse one, which is why this is in the free tier despite costing
 * a `git` call — and why it runs only when the fingerprint is unchanged, the one case where it can
 * change the answer.
 *
 * Never throws, and answers `null` for every way of not knowing: a project outside git is an
 * ordinary case (a fresh `create-expo-app` is not a repository), and the caller then keeps the
 * fingerprint's own answer.
 */
export async function refineWithChangedFilesAsync(
  projectRoot: string,
  { timeoutMs = CHANGED_FILES_TIMEOUT_MS }: { timeoutMs?: number } = {}
): Promise<FileRefinement | null> {
  const { listChangedFilesAsync } = require('./changedFiles') as typeof import('./changedFiles');
  const { classifyChangedFiles } = require('./classify') as typeof import('./classify');

  let timer: NodeJS.Timeout | undefined;
  const deadline = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs);
    timer.unref?.();
  });

  try {
    const changed = await Promise.race([listChangedFilesAsync(projectRoot), deadline]);
    if (!changed?.files) {
      return null;
    }
    const classified = classifyChangedFiles(changed.files);
    return {
      class: classified.class,
      reason:
        classified.reasons[0] ??
        `the native fingerprint is unchanged and nothing in the working tree has changed`,
      counts: classified.counts,
    };
  } catch {
    // git is a convenience here, not the answer. A failure costs the refinement.
    return null;
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
