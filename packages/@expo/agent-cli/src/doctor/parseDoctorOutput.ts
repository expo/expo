// @ref llp/0010-agent-conventions.rfc.md §Upstream asks — `expo-doctor --json` is on the list, and
// this file is what the tool layer does in the meantime.
//
// `expo-doctor` prints prose and nothing else. Every string this parser matches is one of these,
// all read from `packages/expo-doctor/src/doctor.ts` and confirmed against a real run of
// expo-doctor 1.20.1 on `apps/minimal-tester` [observed — 2026-08-23]:
//
//   Running 21 checks on your project...                    (startSpinner, non-interactive form)
//   ✔ Check for lock file                                   (--verbose, per check as it finishes)
//   ✖ Check for overridden dependencies
//   16/21 checks passed. 5 checks failed. Possible issues detected:
//   21/21 checks passed. No issues detected!
//   Advice:                                                 (inside a failed check's block)
//   5 checks failed, indicating possible issues with the project.   (on stderr, then exit 1)
//
// The parse is best-effort by construction and says so in its answer. Two facts make it tractable:
// `@expo/agent-cli` always passes `--verbose`, so every check is named whether it passed or failed, and the
// summary line is a hard boundary — above it is the check list, below it are the failure details.

import type { DoctorCheck, ParsedDoctorOutput } from './types';

/** `expo-doctor` marks a finished check with one of these, under `--verbose`. */
const CHECK_LINE = /^([✔✖])\s+(.+?)(?:\s+\(\d[\d.]*\s*m?s\))?$/;

/** The counts line of a run with failures. */
const FAILURE_SUMMARY = /^(\d+)\/(\d+) checks passed\. (\d+) checks? failed\./m;

/** The counts line of a run with no failures. */
const SUCCESS_SUMMARY = /^(\d+)\/(\d+) checks passed\. No issues detected!/m;

/** The line that opens a failed check's detail block. */
const FAILED_BLOCK = /^✖\s+(.+)$/;

/** Splits a failed check's issues from what to do about them. */
const ADVICE_HEADER = /^Advice:\s*$/;

/**
 * Lines that end the last check's block rather than belonging to it.
 *
 * `expo-doctor` closes with one of these after the detail blocks, on stderr [observed —
 * `Log.exit`/`Log.warn` at the end of `packages/expo-doctor/src/doctor.ts`]. Without them the
 * closing line is read as the last check's advice, which is how a real run ended up suggesting
 * "5 checks failed, indicating possible issues with the project" as a thing to do about a check.
 */
const BLOCK_TERMINATORS = [
  /^\d+ checks? failed, indicating possible issues with the project\./,
  /^One or more checks failed due to network errors,/,
];

/**
 * Read one `expo-doctor` run out of its output.
 *
 * @param raw stdout and stderr of the run, with ANSI escape codes already removed.
 */
export function parseDoctorOutput(raw: string): ParsedDoctorOutput {
  const lines = raw.split('\n').map((line) => line.trimEnd());

  const summary = readSummary(lines);
  if (!summary) {
    // Nothing recognizable: a crash, a Node version banner, an empty run. The caller still has
    // `raw`, and pretending to a count nobody printed would be worse than admitting the gap.
    return { passed: 0, failed: 0, checks: [], parse: 'failed' };
  }

  const listed = readCheckList(lines.slice(0, summary.index));
  const blocks = readFailureBlocks(lines.slice(summary.index + 1));
  const { checks, matchedBlocks } = mergeChecks(listed, blocks);

  return {
    passed: summary.passed,
    failed: summary.failed,
    checks,
    parse: quality({
      summary,
      checks,
      blockCount: blocks.length,
      matchedBlocks,
    }),
  };
}

interface Summary {
  /** Index of the summary line in the split output. */
  index: number;
  passed: number;
  total: number;
  failed: number;
}

/** The counts line, in either of its two spellings. */
function readSummary(lines: string[]): Summary | null {
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]!;
    const failure = FAILURE_SUMMARY.exec(line);
    if (failure) {
      return {
        index,
        passed: Number(failure[1]),
        total: Number(failure[2]),
        failed: Number(failure[3]),
      };
    }
    const success = SUCCESS_SUMMARY.exec(line);
    if (success) {
      return {
        index,
        passed: Number(success[1]),
        total: Number(success[2]),
        failed: 0,
      };
    }
  }
  return null;
}

/** The `✔`/`✖` lines above the summary, which `--verbose` prints one per finished check. */
function readCheckList(lines: string[]): DoctorCheck[] {
  const checks: DoctorCheck[] = [];
  for (const line of lines) {
    const match = CHECK_LINE.exec(line);
    if (match) {
      checks.push({
        name: match[2]!.trim(),
        status: match[1] === '✔' ? 'passed' : 'failed',
        issues: [],
        advice: [],
      });
    }
  }
  return checks;
}

/** The per-check detail below the summary: the name, what it found, and what to do. */
function readFailureBlocks(lines: string[]): DoctorCheck[] {
  const blocks: DoctorCheck[] = [];
  let current: DoctorCheck | null = null;
  let inAdvice = false;

  for (const line of lines) {
    const opener = FAILED_BLOCK.exec(line);
    if (opener) {
      current = {
        name: opener[1]!.trim(),
        status: 'failed',
        issues: [],
        advice: [],
      };
      inAdvice = false;
      blocks.push(current);
      continue;
    }
    if (BLOCK_TERMINATORS.some((terminator) => terminator.test(line))) {
      current = null;
      continue;
    }
    if (!current) {
      continue;
    }
    if (ADVICE_HEADER.test(line)) {
      inAdvice = true;
      continue;
    }
    // Blank lines are the block's own paragraph breaks; they carry nothing and would otherwise
    // become empty issues.
    if (!line.trim()) {
      continue;
    }
    (inAdvice ? current.advice : current.issues).push(line);
  }

  return blocks;
}

/** Fold each failure block into the check of the same name, keeping the listed order. */
function mergeChecks(
  listed: DoctorCheck[],
  blocks: DoctorCheck[]
): { checks: DoctorCheck[]; matchedBlocks: number } {
  const byName = new Map(listed.map((check) => [check.name, check]));
  const checks = [...listed];
  let matchedBlocks = 0;

  for (const block of blocks) {
    const check = byName.get(block.name);
    if (check) {
      check.issues = block.issues;
      check.advice = block.advice;
      check.status = 'failed';
      matchedBlocks++;
      continue;
    }
    // A block naming a check that was never listed: `--verbose` was not in effect, or the wording
    // drifted. Keeping it is what makes a non-verbose run still useful.
    byName.set(block.name, block);
    checks.push(block);
  }

  return { checks, matchedBlocks };
}

/**
 * How much of the run the parse accounts for.
 *
 * `full` is the strong claim — every check the run says it ran is named, the failures line up with
 * the reported count, and every detail block belongs to one of them — so a consumer can treat
 * `checks` as the whole report. Anything short of that is `best-effort`, and `raw` is where the
 * rest of the answer is.
 */
function quality({
  summary,
  checks,
  blockCount,
  matchedBlocks,
}: {
  summary: Summary;
  checks: DoctorCheck[];
  blockCount: number;
  matchedBlocks: number;
}): 'full' | 'best-effort' {
  const failed = checks.filter((check) => check.status === 'failed').length;
  const complete =
    checks.length === summary.total && failed === summary.failed && matchedBlocks === blockCount;
  return complete ? 'full' : 'best-effort';
}
