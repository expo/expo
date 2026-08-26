// @ref llp/0004-smart-start-and-project-state.rfc.md §The impact headline is free, the explanation is not
// @ref llp/0011-impact-and-freshness.rfc.md §Two commands, one classifier
//
// What a change costs, computed from two things `exagent status` already holds: the fingerprint
// its probe took, and the one `.expo/exagent-last-build.json` recorded after the last build this
// CLI ran. No subprocess, no network, no second fingerprint run — see `src/project/localDiff.ts`
// for the diff this leans on and why it is a port rather than a spawn.
//
// **This answers `null` where `exagent impact` answers `needs-native-build`, and that is the
// difference between the two commands rather than a disagreement.** `impact` is a *gate*: it has
// to name a class because `--assert` compares against one, and "unknown" cannot be gated on, so
// its rule is the conservative one — undecided means build, which over-plans at worst. `status` is
// a *report*, and every other line of it treats `unknown` as its own answer that is never rounded
// down (`auth`, `device`, the bundler's readiness). A class this command did not establish has no
// business being printed beside ones it did.

import type { LastBuildFingerprint } from '../plan/lastBuild';
import type { NativePlatform } from '../plan/types';
import type { FingerprintSource } from '../project/fingerprint';
import { diffFingerprintSourcesLocally } from '../project/localDiff';
import { classifyFingerprintDiff } from './classify';
import type { ChangedSource, ImpactClass } from './types';

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
 * @param recorded what `.expo/exagent-last-build.json` holds for the platform, or null.
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
    // Not "unchanged", and not a class either. `exagent dev` writes this record after a native
    // build it ran; a build made by EAS, by Xcode, or on another machine leaves nothing here.
    return undecided(
      null,
      `no build is recorded for ${platform}, so there is nothing to compare this against — "exagent dev" writes the record after a native build it runs`
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
