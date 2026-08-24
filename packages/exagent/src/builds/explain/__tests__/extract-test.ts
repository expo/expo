/* eslint-env jest */
// @ref llp/0011-build-explain.rfc.md §Which match wins
//
// The fixture table is the feature. Every `.log` under `fixtures/` has a `.json` next to it
// holding the phases, the located failure and every other match, and this suite asserts the
// extractor still answers exactly that. `fixtures/README.md` says which logs were captured on a
// real machine and which were written from a documented format; both are pinned the same way,
// because the extractor cannot tell them apart and neither may this test.
//
// The suite below the table is the adversarial half: the cases a rule table gets wrong when
// nobody writes them down.

jest.unmock('fs');
jest.unmock('node:fs');

import fs from 'node:fs';
import path from 'node:path';

import { ANCHORS } from '../anchors';
import { extractFailure, logTail } from '../extract';
import { detectPhases } from '../phases';
import { readLogFileAsync, readLogStreamAsync } from '../readLog';

const FIXTURES = path.join(__dirname, 'fixtures');

/** What a fixture's `.json` holds. Deliberately small: the whole report is pinned elsewhere. */
type Expectation = {
  phases: { name: string; status: string; startLine: number; endLine: number }[];
  failure: {
    phase: string;
    signature: string;
    line: number;
    matchedLine: string;
    confidence: string;
    suggestedCommand: string | null;
  } | null;
  /** `<line>:<signature>` for every other match, which is what `--all` reports. */
  otherSignatures: string[];
};

function fixtureNames(): string[] {
  return fs
    .readdirSync(FIXTURES)
    .filter((file) => file.endsWith('.log'))
    .sort();
}

/** Read one fixture the way the command does, and extract from it with `--all`. */
async function runFixtureAsync(name: string) {
  const read = await readLogFileAsync(path.join(FIXTURES, name));
  const phases = detectPhases(read.lines, null);
  return { read, ...extractFailure(read.lines, phases, { all: true }) };
}

describe('extractFailure, over the committed fixtures', () => {
  it.each(fixtureNames())('%s', async (name) => {
    const expected: Expectation = JSON.parse(
      fs.readFileSync(path.join(FIXTURES, name.replace(/\.log$/, '.json')), 'utf8')
    );
    const { failure, phases, otherFailures } = await runFixtureAsync(name);

    expect(phases).toEqual(expected.phases);
    expect(
      failure && {
        phase: failure.phase,
        signature: failure.signature,
        line: failure.line,
        matchedLine: failure.matchedLine,
        confidence: failure.confidence,
        suggestedCommand: failure.suggestedCommand,
      }
    ).toEqual(expected.failure);
    expect(otherFailures.map((other) => `${other.line}:${other.signature}`)).toEqual(
      expected.otherSignatures
    );
  });

  it('quotes the located line from the log itself, so nothing is invented', async () => {
    for (const name of fixtureNames()) {
      const { failure, read } = await runFixtureAsync(name);
      if (!failure) {
        continue;
      }
      expect(read.lines[failure.line - 1]!.trimEnd()).toBe(failure.matchedLine);
      expect(failure.context.match).toBe(failure.matchedLine);
    }
  });

  it('has a fixture for every rule in the table', () => {
    const covered = new Set<string>();
    for (const name of fixtureNames()) {
      const expected: Expectation = JSON.parse(
        fs.readFileSync(path.join(FIXTURES, name.replace(/\.log$/, '.json')), 'utf8')
      );
      if (expected.failure) {
        covered.add(expected.failure.signature);
      }
      for (const other of expected.otherSignatures) {
        covered.add(other.split(':').slice(1).join(':'));
      }
    }
    // The rules with no fixture yet, named rather than counted: a rule nobody has seen fire is a
    // rule nobody knows is right, and this list is what a reviewer argues with.
    const uncovered = ANCHORS.map((anchor) => anchor.signature).filter(
      (signature) => !covered.has(signature)
    );
    expect(uncovered).toEqual([
      'deps.module-not-found',
      'prebuild.plugin-invalid',
      // Reachable only for a `PluginError:` that is not a resolution failure: the captured
      // fixture's first line matches the narrower `prebuild.plugin-not-found` rule instead.
      'prebuild.plugin-error',
      'pods.version-conflict',
      'pods.install-error',
      'bundle.transform-error',
      'ios.clang.compile-error',
      'ios.script-phase-failed',
      'ios.export.profile-mismatch',
    ]);
  });
});

describe('the rules the fixtures exist to prove', () => {
  it('reports the phase the build stopped in, not one an error word appeared in earlier', async () => {
    // A pod install that printed eight `[!]` lines and succeeded, then an xcodebuild that failed.
    const { failure, phases } = await runFixtureAsync('adversarial-warning-in-successful-phase.log');

    expect(phases.map((phase) => `${phase.name}:${phase.status}`)).toEqual([
      'pod-install:succeeded',
      'xcodebuild:failed',
    ]);
    expect(failure?.signature).toBe('ios.pods.sandbox-out-of-sync');
    expect(failure?.phase).toBe('xcodebuild');
  });

  it('reports the earliest cause in the failing phase, not the tool’s trailing summary', async () => {
    // Gradle prints `* What went wrong:` and `Execution failed for task` *after* the compiler
    // output that explains them. Reading the last match would name the task every time.
    const { failure, otherFailures } = await runFixtureAsync('gradle-aapt-resource-error.log');

    expect(failure?.signature).toBe('android.aapt.resource-error');
    expect(otherFailures.map((other) => other.signature)).toContain('android.gradle.task-failed');
    expect(otherFailures.every((other) => other.line !== failure!.line)).toBe(true);
  });

  it('falls back to the summary, at low confidence, when no rule matched a cause', () => {
    const lines = [
      '> Task :app:someTaskNobodyHasARuleFor',
      'FAILURE: Build failed with an exception.',
      '* What went wrong:',
    ];
    const { failure } = extractFailure(lines, detectPhases(lines));

    expect(failure).toMatchObject({
      signature: 'android.gradle.build-failed',
      confidence: 'low',
      phase: 'gradle',
    });
  });

  it('reports a cause outside every named phase at medium confidence', async () => {
    // Raw `swiftc` output with no build driver above it: the *what* is as certain as ever and only
    // the *where* is a guess, which is what `medium` says.
    const { failure } = await runFixtureAsync('swiftc-compile-errors.log');

    expect(failure).toMatchObject({
      signature: 'ios.swift.compile-error',
      phase: 'unknown',
      confidence: 'medium',
    });
  });

  it('reports nothing rather than something, for a log with no failure in it', async () => {
    const { failure, otherFailures } = await runFixtureAsync('no-failure-successful-pod-install.log');

    expect(failure).toBeNull();
    expect(otherFailures).toEqual([]);
  });

  it('narrows the rules to one platform when the caller names one', async () => {
    const read = await readLogFileAsync(path.join(FIXTURES, 'gradle-kotlin-compile-error.log'));

    // With `--platform ios`, every gradle rule is off the table, so an Android log answers
    // nothing at all rather than answering wrongly.
    const iosPhases = detectPhases(read.lines, 'ios');
    expect(extractFailure(read.lines, iosPhases, { platform: 'ios' }).failure).toBeNull();

    const androidPhases = detectPhases(read.lines, 'android');
    expect(
      extractFailure(read.lines, androidPhases, { platform: 'android' }).failure?.signature
    ).toBe('android.kotlin.compile-error');
  });

  it('reports no other failures unless --all was asked for', async () => {
    const read = await readLogFileAsync(path.join(FIXTURES, 'gradle-kotlin-compile-error.log'));
    const phases = detectPhases(read.lines);

    expect(extractFailure(read.lines, phases).otherFailures).toEqual([]);
    expect(extractFailure(read.lines, phases, { all: true }).otherFailures.length).toBeGreaterThan(
      0
    );
  });

  it('reads a log whose last line was cut off mid-write', async () => {
    const { read, failure } = await runFixtureAsync('adversarial-truncated-mid-stream.log');

    // The file ends without a newline. The partial line is still a line, and the failure above it
    // is still found.
    expect(read.lines[read.lines.length - 1]).not.toBe('');
    expect(failure?.signature).toBe('ios.swift.compile-error');
  });

  it('strips ANSI before matching, so a coloured log answers like a plain one', async () => {
    const coloured = fs.readFileSync(path.join(FIXTURES, 'metro-syntax-error.log'), 'utf8');
    // The captured log really is coloured: this is the recording, not a construction.
    expect(coloured).toMatch(/\[/);

    const { failure } = await runFixtureAsync('metro-syntax-error.log');
    expect(failure?.signature).toBe('bundle.syntax-error');
    expect(failure?.matchedLine).not.toMatch(/\[/);
    expect(failure?.context.after.join('\n')).not.toMatch(/\[/);
  });

  it('carries the caller’s context window, before and after the match', async () => {
    const read = await readLogFileAsync(path.join(FIXTURES, 'xcodebuild-pods-out-of-sync.log'));
    const phases = detectPhases(read.lines);
    const { failure } = extractFailure(read.lines, phases, {
      contextBefore: 2,
      contextAfter: 5,
    });

    expect(failure!.context.before).toHaveLength(2);
    expect(failure!.context.after).toHaveLength(5);
    expect(failure!.context.before[1]).toBe(read.lines[failure!.line - 2]!.trimEnd());
  });
});

describe('logTail', () => {
  it('is the last lines of the log, blank lines dropped', () => {
    const lines = ['a', '', 'b', '   ', 'c'];
    expect(logTail(lines, 2)).toBe('b\nc');
  });

  it('is present for a log with nothing located, which is what makes that a report', async () => {
    const read = await readLogFileAsync(
      path.join(FIXTURES, 'no-failure-successful-pod-install.log')
    );
    expect(logTail(read.lines).split('\n').length).toBeGreaterThan(1);
  });
});

describe('a log too big to hold', () => {
  /** A readable stream of `count` lines, produced lazily so the test never holds the whole log. */
  function hugeLogStream(count: number, tail: string[]): NodeJS.ReadableStream {
    const { Readable } = require('node:stream') as typeof import('node:stream');
    let emitted = 0;
    return new Readable({
      read() {
        if (emitted < count) {
          // A chunk per read, not a line: this is what a real stream hands over, and cutting
          // lines out of chunks is the part that can go wrong.
          const chunk = Array.from(
            { length: 1_000 },
            (_unused, index) => `> Task :app:someTask${emitted + index}: UP-TO-DATE`
          ).join('\n');
          emitted += 1_000;
          this.push(chunk + '\n');
        } else if (tail.length) {
          this.push(tail.join('\n') + '\n');
          tail.length = 0;
        } else {
          this.push(null);
        }
      },
    });
  }

  it('keeps the tail, reports what it dropped, and still finds the failure', async () => {
    const read = await readLogStreamAsync(
      hugeLogStream(400_000, [
        'e: file:///home/expo/app/src/main/java/Note.kt:3:9 Unresolved reference: NoteFormatter',
        'FAILURE: Build failed with an exception.',
      ])
    );

    expect(read.truncated).toBe(true);
    expect(read.droppedLines).toBeGreaterThan(0);
    expect(read.lines).toHaveLength(100_000);
    // The point of keeping the *tail*: a build fails at its end, so truncation must not cost the
    // answer.
    const { failure } = extractFailure(read.lines, detectPhases(read.lines));
    expect(failure?.signature).toBe('android.kotlin.compile-error');
  });

  it('never reads a log file into memory whole', async () => {
    const realFs = jest.requireActual<typeof import('fs')>('fs');
    const readFileSync = jest.spyOn(realFs, 'readFileSync');
    const readFile = jest.spyOn(realFs.promises, 'readFile');

    await readLogFileAsync(path.join(FIXTURES, 'xcodebuild-pods-out-of-sync.log'));

    // `fs.createReadStream` is the only supported way in, and a regression to `readFileSync`
    // would only show up on a machine with a log large enough to kill the process.
    expect(readFileSync).not.toHaveBeenCalled();
    expect(readFile).not.toHaveBeenCalled();
    readFileSync.mockRestore();
    readFile.mockRestore();
  });
});
