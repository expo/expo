// @ref llp/0004-smart-start-and-project-state.rfc.md §Status
// @ref llp/0010-agent-conventions.rfc.md §Exit codes
//
// `status --assert <class>` — the one thing that can make this command non-zero.
//
// The contract it appears to break is real and is not broken: `status` exits 0 *as a report*, and
// a caller who typed `--assert` has asked for a verdict instead. The precedent is
// `runtime:errors --fail-on-error`, which is the identical shape — an information command that
// exits 20 only when a flag converts what it found into a judgment — and the reason the shape is
// safe is that nothing changes unless the caller opts in. A run without the flag is exactly the
// report it was before.
//
// **The report stays honest under the gate.** `--assert` does not make `status` name a class it
// could not establish (llp/0011 §The classifier reads reasons); `FreshnessImpact.class` stays
// `null`. What it does is refuse to pass, which is a different thing and is the safe one: a gate
// that returns 0 because nothing was measured is a gate that does not gate.

import { EXIT_OK, EXIT_OUTCOME_FAILED, EXIT_OUTCOME_TIMEOUT } from '../exitCodes';
import { isStrongerClass, type ImpactClass } from '../impact/types';
import { PROGRAM_PREFIX } from '../programName';
import type { AssertStatus, FreshnessStatus } from './types';

/**
 * The strongest class the report established, or null when nothing usable was established.
 *
 * **Two kinds of "no class", and only one of them is inconclusive.** The report says `class: null`
 * both for a platform that was never built here and for one that was built and could not be
 * measured, and a gate has to tell them apart or it is useless:
 *
 * - **No record at all** (`recordedHash === null`) — nothing this CLI built exists for that
 *   platform, so there is no installed app the change could break and nothing to be wrong about.
 *   Skipped. Requiring every platform would make `--assert` permanently inconclusive for the
 *   ordinary project that builds for one of them, which is most of them.
 * - **A record that could not be measured** (`recordedHash` set, class still null) — a v1 record
 *   holding only a hash, or a fingerprint with no sources. That platform *is* in play and its cost
 *   is unknown, so the whole answer is unknown. Never skipped.
 *
 * Under `--build` the gate is about the **named build**, so only the `eas` axis is considered: the
 * local axis answers "does this differ from what I built here", which is a different question and
 * one the caller did not ask (llp/0021 §The rules).
 */
export function strongestClass(freshness: FreshnessStatus | null): ImpactClass | null {
  const axis = freshness?.comparison.kind === 'eas-build' ? 'eas' : 'local';
  const platforms = (freshness?.platforms ?? []).filter(
    (platform) => platform.impact != null && platform.backend === axis
  );
  // A platform that was built here and could not be measured makes the whole answer unknown.
  if (
    platforms.some((platform) => platform.impact!.class == null && platform.recordedHash != null)
  ) {
    return null;
  }

  const classes = platforms
    .map((platform) => platform.impact!.class)
    .filter((impactClass): impactClass is ImpactClass => impactClass != null);
  if (!classes.length) {
    return null;
  }

  let strongest = classes[0]!;
  for (const impactClass of classes) {
    if (isStrongerClass(impactClass, strongest)) {
      strongest = impactClass;
    }
  }
  return strongest;
}

/**
 * Judge the report against the class the caller asserted.
 *
 * Three outcomes, and the middle one is the reason this is not two:
 *
 * - **`0`** — the real class is at most what was asserted.
 * - **`20`** — it is stronger. The tool worked and the operation it performed — the gate — did not
 *   pass, which is llp/0010's `20`–`29` band. Never `1`: nothing about the call was wrong, and `1`
 *   would send an agent looking for a usage mistake it did not make.
 * - **`22`** — nothing established a class at all: no build recorded, a record holding only a hash,
 *   no fingerprint CLI. llp/0010's code for "nothing was shown to be wrong and nothing was proved
 *   right", and `runtime:errors --fail-on-error` already uses it for the identical situation — an
 *   empty window from a runtime that cannot report. Distinct from `20` because the fix is
 *   different: `20` means change the code or raise the assertion, `22` means give the gate
 *   something to measure.
 */
export function buildAssertStatus(
  asserted: ImpactClass,
  freshness: FreshnessStatus | null
): AssertStatus {
  const actual = strongestClass(freshness);

  if (actual == null) {
    return {
      asserted,
      actual: null,
      ok: false,
      exitCode: EXIT_OUTCOME_TIMEOUT,
      reason: `No class could be established, so "${asserted}" was not verified — ${undecidedCause(freshness)}. A gate that passed on an answer nothing measured would not be a gate; run "${PROGRAM_PREFIX} status --explain" to see what is missing, or "${PROGRAM_PREFIX} dev" once to record a build to compare against.`,
    };
  }

  if (isStrongerClass(actual, asserted)) {
    return {
      asserted,
      actual,
      ok: false,
      exitCode: EXIT_OUTCOME_FAILED,
      reason: `The change costs "${actual}", which is more than the asserted "${asserted}"${firstReason(freshness)}.`,
    };
  }

  return {
    asserted,
    actual,
    ok: true,
    exitCode: EXIT_OK,
    reason: `The change costs "${actual}", which is at most the asserted "${asserted}".`,
  };
}

/**
 * Why nothing was established, in the words the freshness section already used.
 *
 * Verbatim, and never capitalized: these sentences begin with whatever carried the finding, which
 * is often a path. `Apps/observe-tester/tsconfig.json` is what capitalizing them produced
 * [observed — live, 2026-08-26], so the surrounding sentence is written to take a lower-case clause
 * instead.
 */
function undecidedCause(freshness: FreshnessStatus | null): string {
  if (!freshness) {
    return 'the project could not be probed';
  }
  // The platform that was built here and could not be measured, if there is one; otherwise the
  // first platform with nothing to compare against. The first is the more surprising cause, so it
  // is the one worth naming.
  const axis = freshness.comparison.kind === 'eas-build' ? 'eas' : 'local';
  const considered = freshness.platforms.filter((platform) => platform.backend === axis);
  const inPlay = considered.find(
    (platform) => platform.impact?.class == null && platform.recordedHash != null
  );
  const reason = (inPlay ?? considered.find((platform) => platform.impact?.class == null))?.impact
    ?.reason;
  return reason ?? 'nothing was compared';
}

/** The sentence that carried the class, so a failing gate says what tripped it. */
function firstReason(freshness: FreshnessStatus | null): string {
  const axis = freshness?.comparison.kind === 'eas-build' ? 'eas' : 'local';
  const impact = freshness?.platforms.find(
    (platform) => platform.backend === axis && platform.impact?.class != null
  )?.impact;
  return impact ? `: ${impact.reason}` : '';
}
