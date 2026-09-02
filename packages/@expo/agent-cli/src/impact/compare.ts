// @ref llp/0011-impact-and-freshness.rfc.md §The three comparisons
// Where the two fingerprints being compared come from. One function per mode, each answering the
// same shape, so `impactAsync` orchestrates without knowing which mode ran.

import { readLastBuildRecord } from '../plan/lastBuild';
import { PROGRAM_NAME } from '../programName';
import { diffFingerprintsAsync, generateFingerprintAsync } from '../project/fingerprint';
import type { FingerprintDiffItem, FingerprintSource } from '../project/fingerprint';
import { easCliArgs, easCliLabel, type EasCli } from '../utils/easCli';
import { spawnSubprocessAsync } from '../utils/subprocess';
import {
  looksLikeRunnerNoise,
  looksLikeWrapperCrash,
  runnerCrashDetail,
  runnerNoiseLine,
  runnerNoiseReason,
} from '../utils/wrapperCrash';
import type { ComparisonSide } from './types';

/** What every comparison mode answers with. */
export interface Comparison {
  base: ComparisonSide;
  head: ComparisonSide;
  /**
   * The diff, or `null` when it could not be produced.
   *
   * `null` with `fingerprintChanged` set is a real state: `eas fingerprint:compare` can say the
   * hashes differ without this CLI being able to read its item list, and a recorded build from
   * before the v2 record has a hash and no sources.
   */
  items: FingerprintDiffItem[] | null;
  /** `null` when neither a diff nor a pair of hashes decided it. */
  fingerprintChanged: boolean | null;
  /** Why this answer is approximate. Empty when it is not. */
  caveats: string[];
  /** Why there is no answer at all. Null when there is one. */
  error: string | null;
}

/**
 * Compare the working tree against what `@expo/agent-cli` recorded after its last native build.
 *
 * The default mode, and the one that answers the question an agent asks most: I changed some
 * files, do I need to build again?
 */
export async function compareWithLastBuildAsync(
  projectRoot: string,
  platform: 'ios' | 'android',
  { preset, fingerprintCache }: { preset?: string; fingerprintCache?: boolean } = {}
): Promise<Comparison> {
  const recorded = readLastBuildRecord(projectRoot)[platform];
  const head = await generateFingerprintAsync(projectRoot, {
    platform,
    preset,
    cache: fingerprintCache,
  });

  const headSide: ComparisonSide = { label: 'working tree', hash: head.hash };
  const baseSide: ComparisonSide = {
    label: `last build recorded by ${PROGRAM_NAME}`,
    hash: recorded?.hash ?? null,
  };

  if (!head.hash) {
    return {
      base: baseSide,
      head: headSide,
      items: null,
      fingerprintChanged: null,
      caveats: [],
      error: describeGenerateFailure(head.error, platform, preset),
    };
  }

  if (!recorded) {
    return {
      base: baseSide,
      head: headSide,
      items: null,
      // Nothing recorded is not "unchanged". `@expo/agent-cli dev` writes the record after a native build
      // it ran; a build made by EAS, by Xcode, or by another machine leaves nothing here.
      fingerprintChanged: null,
      caveats: [
        `No build is recorded for ${platform}, so there is nothing to compare against. "${PROGRAM_NAME} dev" writes this record after a native build it runs; for a cloud build, compare against it directly with --build <id>.`,
      ],
      error: null,
    };
  }

  const changed = recorded.hash !== head.hash;

  if (!recorded.sources) {
    return {
      base: baseSide,
      head: headSide,
      items: null,
      fingerprintChanged: changed,
      caveats: [
        `The recorded build stored only a hash, so this can say whether the native surface changed and not what changed. The next build recorded by this CLI stores the whole fingerprint.`,
      ],
      error: null,
    };
  }

  if (!head.sources) {
    return {
      base: baseSide,
      head: headSide,
      items: null,
      fingerprintChanged: changed,
      caveats: [
        `The fingerprint CLI returned a hash with no sources, so this can say whether the native surface changed and not what changed.`,
      ],
      error: null,
    };
  }

  const diff = await diffFingerprintsAsync(
    projectRoot,
    { hash: recorded.hash, sources: recorded.sources },
    { hash: head.hash, sources: head.sources }
  );
  if (!diff.items) {
    return {
      base: baseSide,
      head: headSide,
      items: null,
      fingerprintChanged: changed,
      caveats: diff.error ? [diff.error] : [],
      error: null,
    };
  }

  return {
    base: baseSide,
    head: headSide,
    items: diff.items,
    fingerprintChanged: changed,
    caveats: [],
    error: null,
  };
}

/**
 * Why the working tree could not be fingerprinted, in the caller's terms.
 *
 * One case gets its own sentence, because the generic one sends the reader to the wrong place:
 * `--preset` reached the published `@expo/fingerprint` only after 0.20.9, so a project on the
 * version the registry serves today rejects the flag outright [observed — 2026-08-24, a real SDK
 * 57 project: `unknown or unexpected option: --preset`]. The command does not pass it unasked for
 * exactly this reason; a caller who *did* ask needs to be told it is their CLI's age and not their
 * project.
 */
export function describeGenerateFailure(
  error: string | undefined,
  platform: string,
  preset: string | undefined
): string {
  const reason =
    error ?? `The fingerprint of the working tree could not be computed for ${platform}.`;
  if (preset && /unknown or unexpected option: --preset/.test(reason)) {
    return [
      `The @expo/fingerprint CLI installed in this project does not accept --preset.`,
      `Why: the flag was added to the CLI after the version this project has, so it rejected it: ${reason}`,
      `How: drop --preset — without it the CLI applies its own default and the comparison still works — or upgrade the project's @expo/fingerprint.`,
    ].join('\n');
  }
  return reason;
}

/**
 * Compare the working directory against an EAS build's fingerprint.
 *
 * Server ground truth, and the mode to reach for when the question is "is my last cloud build
 * stale": it needs no local record, so it answers for a build this machine never ran.
 *
 * `eas fingerprint:compare [HASH] --build-id <id>` compares one hash against the local directory
 * when given one alone [observed — eas-cli README, v22.2.0]. It takes **no platform**, and that is
 * not an omission: a build was made for one platform, and which one is a fact about the build
 * rather than a question to ask. So this runs once per command, not once per platform, and the
 * report carries one entry whose `platform` is `null` unless the caller named one.
 *
 * **It does not print a diff** [observed — 2026-08-26, eas-cli 22.4.0, recorded in
 * `src/__fixtures__/eas/fingerprint-compare.json`]. `--json` prints
 * `{ fingerprint1, fingerprint2 }`, each a whole `{ hash, sources }` — `fingerprint1` is the
 * build's fingerprint, `fingerprint2` is the one it computed from this directory. The guess that
 * it would answer with `FingerprintDiffItem[]` was wrong, and against the real service the old
 * parser found neither a diff nor a hash and reported only a caveat carrying a megabyte of
 * payload.
 *
 * So the diff is produced *here*, by handing both fingerprints to the project's own
 * `fingerprint:diff` — the same call the working-tree mode already makes, and the reason the
 * sources riding along in the payload matter. The hashes are the server's answer to "did anything
 * change"; the diff is a local elaboration of it, and a failure to elaborate is a caveat rather
 * than a lost answer.
 *
 * The older guesses are kept as fallbacks, because a shape that changes should degrade to
 * "whether" rather than to nothing.
 */
export async function compareWithEasBuildAsync(
  easCli: EasCli,
  projectRoot: string,
  buildId: string
): Promise<Comparison> {
  const args = buildEasCompareArgs(buildId);
  const result = await spawnSubprocessAsync(easCli.command, easCliArgs(easCli, args), {
    cwd: projectRoot,
    output: 'capture',
  });

  const baseSide: ComparisonSide = { label: `EAS build ${buildId}`, hash: null };
  const headSide: ComparisonSide = { label: 'working tree', hash: null };

  if (result.spawnError || result.exitCode !== 0) {
    // @ref llp/0001-agentic-cli-on-expo-cli.rfc.md §Constraints — the binary under the name `eas`
    // may be a wrapper, a shim or a stale link. Its bytes are not an answer about this build, and
    // the "check the id, check your sign-in" line below is advice about neither problem it has.
    const wrapperCrash = !result.spawnError && looksLikeWrapperCrash({ tool: 'eas', ...result });
    // F93, the same guard the build lookup takes: a spawn that printed only the runner's install
    // progress never reached the CLI, so "check the id, check your sign-in" is advice about a
    // problem this run does not have.
    const runnerNoise = !result.spawnError && looksLikeRunnerNoise({ tool: 'eas', ...result });
    return {
      base: baseSide,
      head: headSide,
      items: null,
      fingerprintChanged: null,
      caveats: [],
      error: runnerNoise
        ? [
            `Could not compare against EAS build ${buildId}.`,
            `Why: ${runnerNoiseReason({ tool: 'eas', exitCode: result.exitCode }, easCliLabel(easCli), runnerNoiseLine(result.stderr))}.`,
            `How: run this command again — the install completes once and the next run is warm. "npm install --save-dev eas-cli" pins the CLI into the project, which removes the download from every run.`,
          ].join('\n')
        : wrapperCrash
          ? [
              `Could not compare against EAS build ${buildId}.`,
              `Why: "${[easCliLabel(easCli), ...args].join(' ')}" ${describeExit(result.exitCode, result.spawnError)}.`,
              runnerCrashDetail({ tool: 'eas', exitCode: result.exitCode }, easCliLabel(easCli)),
            ].join('\n')
          : [
              `Could not compare against EAS build ${buildId}.`,
              `Why: "${[easCliLabel(easCli), ...args].join(' ')}" ${describeExit(result.exitCode, result.spawnError)}${
                result.stderr.trim() ? `: ${outputTail(result.stderr)}` : ''
              }`,
              `How: check the id with "npx eas build:list --limit 5 --json --non-interactive", and that this machine is signed in to the account that owns it.`,
            ].join('\n'),
    };
  }

  const parsed = parseEasCompare(result.stdout);
  const elaborated = await elaborateDiffAsync(projectRoot, parsed);

  return {
    base: { ...baseSide, hash: parsed.baseHash },
    head: { ...headSide, hash: parsed.headHash },
    items: elaborated.items,
    fingerprintChanged: parsed.fingerprintChanged,
    caveats: [...parsed.caveats, ...elaborated.caveats],
    error: null,
  };
}

/**
 * Turn a pair of whole fingerprints into the list of what differs.
 *
 * Only runs when the payload carried both sides' sources and no diff of its own, which is the
 * recorded shape. Everything else passes through untouched — including a payload that *did* carry
 * a diff, whose items are already the answer.
 */
async function elaborateDiffAsync(
  projectRoot: string,
  parsed: EasCompareParse
): Promise<{ items: FingerprintDiffItem[] | null; caveats: string[] }> {
  const { items, baseHash, headHash, baseSources, headSources } = parsed;
  if (items || !baseSources || !headSources || !baseHash || !headHash) {
    return { items, caveats: [] };
  }

  const diff = await diffFingerprintsAsync(
    projectRoot,
    { hash: baseHash, sources: baseSources },
    { hash: headHash, sources: headSources }
  );
  // The hashes already answered whether anything changed, so a diff that could not be produced
  // costs the detail and not the verdict.
  return { items: diff.items, caveats: diff.items ? [] : diff.error ? [diff.error] : [] };
}

/**
 * The argv of the EAS comparison.
 *
 * Pinned by a unit test, because it is the whole of what this mode does and a wrong flag here is
 * an interactive prompt against a pipe with nothing attached to stdin.
 */
export function buildEasCompareArgs(buildId: string): string[] {
  return ['fingerprint:compare', '--build-id', buildId, '--json', '--non-interactive'];
}

/** What could be read out of an `eas fingerprint:compare --json` payload. */
export interface EasCompareParse {
  items: FingerprintDiffItem[] | null;
  fingerprintChanged: boolean | null;
  baseHash: string | null;
  headHash: string | null;
  /** Each side's own sources, when the payload carried whole fingerprints. */
  baseSources: FingerprintSource[] | null;
  headSources: FingerprintSource[] | null;
  caveats: string[];
}

/**
 * Read the comparison out of whatever eas-cli printed.
 *
 * The recorded shape is read first, and the older guesses are kept behind it: this is another
 * CLI's payload across a process boundary, and a field that moves must degrade to a smaller answer
 * rather than to none. A payload that yields nothing at all produces a caveat carrying its tail,
 * so a caller who hits it can report exactly what to fix.
 */
export function parseEasCompare(stdout: string): EasCompareParse {
  const caveats: string[] = [];
  const payload = parseJsonPayload(stdout);

  if (payload === null) {
    return {
      items: null,
      fingerprintChanged: null,
      baseHash: null,
      headHash: null,
      baseSources: null,
      headSources: null,
      caveats: [
        `"eas fingerprint:compare --json" printed something this CLI could not parse as JSON, so only the hashes below were read. What it printed: ${outputTail(stdout)}`,
      ],
    };
  }

  const items = findDiffItems(payload);
  const pair = findFingerprintPair(payload);
  const baseHash = pair?.base.hash ?? findHash(payload, ['builds', 'build', 'base', 'first']);
  const headHash =
    pair?.head.hash ?? findHash(payload, ['projects', 'project', 'head', 'second', 'local']);

  // Silent when the pair was read: two whole fingerprints are a shape this CLI recognises, and the
  // diff it does not carry is the caller's to produce.
  if (!items && !pair) {
    caveats.push(
      `"eas fingerprint:compare --json" answered in a shape this CLI does not recognise, so it reports whether the fingerprints differ and not what differs. What it printed: ${outputTail(JSON.stringify(payload))}`
    );
  }

  const fingerprintChanged = items
    ? items.length > 0
    : baseHash && headHash
      ? baseHash !== headHash
      : null;

  return {
    items,
    fingerprintChanged,
    baseHash,
    headHash,
    baseSources: pair?.base.sources ?? null,
    headSources: pair?.head.sources ?? null,
    caveats,
  };
}

/** One whole fingerprint, as `fingerprint:compare` prints each side. */
interface ParsedFingerprint {
  hash: string;
  sources: FingerprintSource[];
}

/**
 * The two whole fingerprints, when the payload is the recorded shape.
 *
 * `fingerprint1` is the *base* — the build, the update, or the first hash given — and
 * `fingerprint2` is the *head*, which for `--build-id` is the working directory. Both sides must
 * be complete: half a pair cannot be diffed, and the hash-only fallbacks below already cover a
 * payload that carries hashes and nothing else.
 */
function findFingerprintPair(
  payload: unknown
): { base: ParsedFingerprint; head: ParsedFingerprint } | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }
  const record = payload as Record<string, unknown>;
  const base = readFingerprint(record.fingerprint1);
  const head = readFingerprint(record.fingerprint2);
  return base && head ? { base, head } : null;
}

/** One side of the pair, or null when it is not a fingerprint. */
function readFingerprint(value: unknown): ParsedFingerprint | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const { hash, sources } = value as { hash?: unknown; sources?: unknown };
  if (typeof hash !== 'string' || !hash || !Array.isArray(sources)) {
    return null;
  }
  return { hash, sources: sources as FingerprintSource[] };
}

/** The array of diff items, wherever in the payload it is. */
function findDiffItems(payload: unknown): FingerprintDiffItem[] | null {
  if (isDiffItemArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    for (const key of ['diff', 'fingerprintDiff', 'differences', 'changes']) {
      const value = (payload as Record<string, unknown>)[key];
      if (isDiffItemArray(value)) {
        return value;
      }
    }
  }
  return null;
}

/**
 * Whether a value is a list of `FingerprintDiffItem`.
 *
 * An empty array counts — "nothing differs" is the answer this mode most wants to give — and a
 * non-empty one has to have the `op` field, which is what makes this a recognition rather than a
 * hope.
 */
function isDiffItemArray(value: unknown): value is FingerprintDiffItem[] {
  if (!Array.isArray(value)) {
    return false;
  }
  return value.every(
    (item) =>
      item != null &&
      typeof item === 'object' &&
      ['added', 'removed', 'changed'].includes((item as { op?: unknown }).op as string)
  );
}

/** A hash under any of the given keys, at the top level or one nesting in. */
function findHash(payload: unknown, keys: string[]): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const record = payload as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value) {
      return value;
    }
    if (value && typeof value === 'object') {
      const nested = (value as Record<string, unknown>).hash;
      if (typeof nested === 'string' && nested) {
        return nested;
      }
    }
  }
  const hash = record.hash;
  return typeof hash === 'string' && hash ? hash : null;
}

/** The last JSON value on stdout, object or array. */
function parseJsonPayload(stdout: string): unknown {
  const trimmed = stdout.trim();
  const start = Math.min(
    ...[trimmed.indexOf('{'), trimmed.indexOf('[')].filter((index) => index >= 0)
  );
  if (!Number.isFinite(start)) {
    return null;
  }
  try {
    return JSON.parse(trimmed.slice(start));
  } catch {
    return null;
  }
}

/** How much of an unreadable payload rides along, so a caller can see what to fix. */
const TAIL_LENGTH = 400;

function outputTail(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > TAIL_LENGTH ? `…${trimmed.slice(-TAIL_LENGTH)}` : trimmed;
}

function describeExit(exitCode: number | null, spawnError?: NodeJS.ErrnoException): string {
  if (spawnError) {
    return `could not be started (${spawnError.code ?? spawnError.message})`;
  }
  return `exited with ${exitCode}`;
}
