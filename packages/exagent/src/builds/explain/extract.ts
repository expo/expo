// @ref llp/0012-build-explain.rfc.md §Which match wins
//
// Turn a segmented log into one located failure. Pure: lines and phases in, data out — no file
// system, no network, no subprocess. That is what makes "deterministic extraction, not model
// summarization" a checkable claim rather than a slogan: the same log always produces the same
// answer, and a fixture pins it.

import { type Anchor, anchorFor } from './anchors';
import { markPhaseStatuses, phaseAllowedOnPlatform, phaseIndexForLine } from './phases';
import type { Confidence, Failure, Phase } from './types';

/** How many lines of context a report carries when the caller names none. */
export const DEFAULT_CONTEXT_BEFORE = 8;

/**
 * Context *after* the match is larger than before it, and deliberately.
 *
 * A compiler prints the cause first and the detail under it — the code frame, the candidate paths
 * Metro tried, the modules a duplicate class came from. The lines before a match are the ones a
 * reader already has from the phase name.
 */
export const DEFAULT_CONTEXT_AFTER = 20;

/** How many lines of the log's end travel in `logTail`, matching `deploy`'s `outputTail`. */
export const LOG_TAIL_LINES = 40;

/** How many entries `--all` may report, so a log full of one error does not become the payload. */
export const MAX_OTHER_FAILURES = 10;

export interface ExtractOptions {
  /** The caller's `--platform` hint, which rules out the other platform's rules. */
  platform?: 'ios' | 'android' | null;
  contextBefore?: number;
  contextAfter?: number;
  /** Report every match, not only the one the failing phase produced. */
  all?: boolean;
}

export interface ExtractResult {
  /** The phases, now with `status` filled in from where the failure landed. */
  phases: Phase[];
  failure: Failure | null;
  /** Every other match, when `all` was asked for. `[]` otherwise. */
  otherFailures: Failure[];
}

/** One anchor match, before it is decided which of them is the answer. */
interface Match {
  anchor: Anchor;
  match: RegExpMatchArray;
  /** 1-based. */
  line: number;
  phaseIndex: number;
}

/**
 * Locate the failure a build log is about.
 *
 * The rule, in one sentence: **the failing phase is the one the last failure marker is in, and
 * inside it the earliest `cause` wins.**
 *
 * Both halves earn their place.
 *
 * *Last* marker decides the phase, because a build stops where it fails: markers earlier in the
 * log belong to steps the build went on past. This is what makes the "an error word in a
 * successful phase" case answer correctly — a pod install that printed `[!] ExpoFont has added 2
 * script phases` and then succeeded is followed by an xcodebuild that failed, and the xcodebuild
 * is what gets reported.
 *
 * *Earliest cause* decides the line, because a tool reports its own failure after the fact.
 * Gradle's `* What went wrong:` is the last thing in the log and says nothing; the Kotlin
 * `e: … error:` line hundreds of lines above it is the answer. Taking the last match would report
 * the summary every time.
 *
 * @param lines the log, ANSI already stripped, one entry per line.
 * @param phases the segments `detectPhases` produced over the same lines.
 * @returns the phases with statuses, the failure, and the other matches when `all` was asked for.
 */
export function extractFailure(
  lines: string[],
  phases: Phase[],
  options: ExtractOptions = {}
): ExtractResult {
  const {
    platform = null,
    contextBefore = DEFAULT_CONTEXT_BEFORE,
    contextAfter = DEFAULT_CONTEXT_AFTER,
    all = false,
  } = options;

  const isPhaseAllowed = (phase: Phase['name']) => phaseAllowedOnPlatform(phase, platform);
  const matches: Match[] = [];

  for (let index = 0; index < lines.length; index++) {
    const found = anchorFor(lines[index]!, isPhaseAllowed);
    if (found) {
      const line = index + 1;
      matches.push({ ...found, line, phaseIndex: phaseIndexForLine(phases, line) });
    }
  }

  if (matches.length === 0) {
    return { phases: markPhaseStatuses(phases, -1), failure: null, otherFailures: [] };
  }

  const chosen = chooseMatch(matches);
  const failure = toFailure(chosen, lines, phases, { contextBefore, contextAfter });
  const otherFailures = all
    ? matches
        .filter((candidate) => candidate.line !== chosen.line)
        .slice(0, MAX_OTHER_FAILURES)
        .map((candidate) => toFailure(candidate, lines, phases, { contextBefore, contextAfter }))
    : [];

  return {
    phases: markPhaseStatuses(phases, chosen.phaseIndex),
    failure,
    otherFailures,
  };
}

/**
 * Pick the one match the report is about.
 *
 * A `summary` is what identifies the failing phase when there is one, because it is the tool
 * saying "I stopped here". With no summary anywhere, the last `cause` is the best evidence of
 * where the log ends, and the same "earliest inside that phase" rule then applies.
 */
function chooseMatch(matches: Match[]): Match {
  const summaries = matches.filter((candidate) => candidate.anchor.kind === 'summary');
  const markers = summaries.length ? summaries : matches;
  const marker = markers[markers.length - 1]!;

  // The earliest cause in that phase, wherever it sits relative to the summary. npm prints its
  // `npm error code E404` classification *before* the 404 it classifies, and Gradle prints
  // `* What went wrong:` long after the compiler error — one rule reads both, because the rule is
  // about the phase and not about the order the tool chose.
  const firstCauseInPhase = matches.find(
    (candidate) => candidate.anchor.kind === 'cause' && candidate.phaseIndex === marker.phaseIndex
  );

  return firstCauseInPhase ?? marker;
}

/** Turn the chosen match into the reported failure, with its context and its next command. */
function toFailure(
  { anchor, match, line, phaseIndex }: Match,
  lines: string[],
  phases: Phase[],
  { contextBefore, contextAfter }: { contextBefore: number; contextAfter: number }
): Failure {
  const index = line - 1;
  const matchedLine = lines[index]!.trimEnd();

  return {
    phase: phases[phaseIndex]?.name ?? 'unknown',
    signature: anchor.signature,
    line,
    message: anchor.message,
    matchedLine,
    context: {
      before: lines.slice(Math.max(0, index - contextBefore), index).map(trimEnd),
      match: matchedLine,
      after: lines.slice(index + 1, index + 1 + contextAfter).map(trimEnd),
    },
    confidence: confidenceFor(anchor, phases[phaseIndex]?.name ?? 'unknown'),
    suggestedCommand: anchor.suggestedCommand?.(match) ?? null,
    docsUrl: anchor.docsUrl ?? null,
  };
}

/**
 * How much of the answer this match is worth.
 *
 * A `summary` is always `low`: it names the tool that stopped and nothing about why, and the
 * caller should read `logTail`. A `cause` in a named phase is `high`. A `cause` in `unknown` is
 * `medium` — the *what* is as certain as ever, and only the *where* is a guess.
 */
function confidenceFor(anchor: Anchor, phase: Phase['name']): Confidence {
  if (anchor.kind === 'summary') {
    return 'low';
  }
  return phase === 'unknown' ? 'medium' : 'high';
}

/** The last lines of the log, for the payload of a report that located nothing. */
export function logTail(lines: string[], maxLines: number = LOG_TAIL_LINES): string {
  return lines.map(trimEnd).filter(Boolean).slice(-maxLines).join('\n');
}

function trimEnd(line: string): string {
  return line.trimEnd();
}
