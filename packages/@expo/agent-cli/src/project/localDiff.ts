// @ref llp/0004-smart-start-and-project-state.rfc.md §Status
// @ref llp/0011-impact-and-freshness.rfc.md §The classifier reads `reasons`
//
// `fingerprint:diff` in process, so `@expo/agent-cli status` can classify a change without spawning
// anything. The CLI's own diff is a subprocess over two temporary files
// (`diffFingerprintsAsync`), which is the right price under `--explain --build <id>` — a caller who
// asked for it — and the wrong one for a line on a report that promises to be instant.
//
// **This is a port, and the constraint of llp/0001 is intact.** Nothing is imported from
// `@expo/fingerprint`: what is reproduced here is a set difference over two lists of
// `{identity, hash}`, and the only thing borrowed is the *identity* rule, which
// `packages/@expo/fingerprint/src/Sort.ts` `compareSource` spells out. A recorded pair of real
// fingerprints and the real CLI's answer for them pin the equivalence
// (`src/__fixtures__/fingerprint/`), so a port that drifts fails a test rather than a user.
//
// **A keyed join, not a merge over sorted lists.** Upstream walks two lists in `compareSource`
// order, which is correct and depends on both sides still being sorted that way. A map keyed on
// the same identity gets the same answer and cannot be broken by a re-ordering, so the one way the
// port could silently disagree is closed by construction. The item *order* differs, and nothing
// reads it: the classifier takes the strongest class over the whole list.

import type { FingerprintDiffItem, FingerprintSource } from './fingerprint';

/** Types the sourcer emits, and the only ones an identity can be built for. */
const KNOWN_TYPES = new Set(['file', 'dir', 'contents', 'package']);

/**
 * What makes two sources *the same source*.
 *
 * Ported from `compareSource` [observed — `packages/@expo/fingerprint/src/Sort.ts`, 2026-08-26],
 * which orders on exactly this value and therefore defines it. `overrideHashKey` wins wherever it
 * is set, because that is the sourcer saying "identify this by the key, not by where it lives".
 *
 * A `package` is identified by `name@version`, which is why a version bump reads as a **removal
 * and an addition** rather than a change — pinned by the recorded diff, because it is the rule a
 * reimplementation would most plausibly get wrong.
 *
 * Null for anything this version cannot name. A source with no identity cannot be matched against
 * another, and inventing one would pair two unrelated sources silently.
 */
export function sourceIdentity(source: FingerprintSource): string | null {
  const type = typeof source.type === 'string' ? source.type : null;
  if (!type || !KNOWN_TYPES.has(type)) {
    return null;
  }

  const override = readString(source.overrideHashKey);
  if (override) {
    return `${type}:${override}`;
  }
  if (type === 'contents') {
    const id = readString(source.id);
    return id ? `${type}:${id}` : null;
  }
  if (type === 'package') {
    const name = readString(source.name);
    const version = readString(source.version);
    return name && version ? `${type}:${name}@${version}` : null;
  }
  const filePath = readString(source.filePath);
  return filePath ? `${type}:${filePath}` : null;
}

/**
 * The difference between two fingerprints' sources, in the shape `fingerprint:diff` prints.
 *
 * Pure and synchronous: no subprocess, no temporary files, no `await`. That is the whole reason it
 * exists — the headline on `@expo/agent-cli status` is computed from two source lists the command already
 * holds in memory (the probe's, and the one `.expo/agent-cli-last-build.json` recorded), so it costs
 * nothing beyond the walk.
 *
 * A source with no identity is left out of both sides rather than reported as added or removed:
 * it cannot be matched, so nothing about it has been established.
 */
export function diffFingerprintSourcesLocally(
  base: FingerprintSource[],
  head: FingerprintSource[]
): FingerprintDiffItem[] {
  const baseByIdentity = indexByIdentity(base);
  const headByIdentity = indexByIdentity(head);
  const items: FingerprintDiffItem[] = [];

  for (const [identity, beforeSource] of baseByIdentity) {
    const afterSource = headByIdentity.get(identity);
    if (!afterSource) {
      items.push({ op: 'removed', removedSource: beforeSource });
    } else if (beforeSource.hash !== afterSource.hash) {
      items.push({ op: 'changed', beforeSource, afterSource });
    }
  }

  for (const [identity, addedSource] of headByIdentity) {
    if (!baseByIdentity.has(identity)) {
      items.push({ op: 'added', addedSource });
    }
  }

  return items;
}

/**
 * One entry per identity.
 *
 * A repeated identity keeps the **first** occurrence, which is what a merge join over a sorted
 * list would compare too. Real fingerprints do not repeat one — the sourcer dedupes — so this only
 * decides the behaviour of a payload that should not exist.
 */
function indexByIdentity(sources: FingerprintSource[]): Map<string, FingerprintSource> {
  const index = new Map<string, FingerprintSource>();
  for (const source of sources) {
    const identity = sourceIdentity(source);
    if (identity != null && !index.has(identity)) {
      index.set(identity, source);
    }
  }
  return index;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}
