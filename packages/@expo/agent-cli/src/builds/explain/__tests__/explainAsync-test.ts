/* eslint-env jest */
// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract
// The shape test. The top-level keys of `inspect:build-log --json` are the de-facto version of this
// command, so they are pinned here and must not depend on what the log held: an agent reading
// `failure` on a clean log gets `null`, never a missing key.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { EXIT_OUTCOME_TIMEOUT } from '../../../exitCodes';
import { CommandError } from '../../../utils/errors';
import { buildExplainReport, explainAsync } from '../explainAsync';
import { readLogFileAsync } from '../readLog';
import type { ExplainOptions } from '../resolveOptions';

// The suite-wide `fs` mock is memfs, and these read logs committed to this repository.
// `jest.unmock` is hoisted above the imports, so it belongs below them (`import/first`).
jest.unmock('fs');
jest.unmock('node:fs');

const FIXTURES = path.join(__dirname, 'fixtures');

const BASE_OPTIONS: ExplainOptions = {
  source: { kind: 'file', path: '/tmp/build.log' },
  platform: null,
  contextBefore: 8,
  contextAfter: 20,
  all: false,
  json: true,
  followups: true,
};

async function reportForAsync(fixture: string, overrides: Partial<ExplainOptions> = {}) {
  const logPath = path.join(FIXTURES, fixture);
  const read = await readLogFileAsync(logPath);
  return buildExplainReport(read, {
    ...BASE_OPTIONS,
    source: { kind: 'file', path: logPath },
    ...overrides,
  });
}

/** Every top-level key, in the order the type declares them. */
const TOP_LEVEL_KEYS = ['source', 'phases', 'failure', 'otherFailures', 'logTail', 'followups'];

describe('the --json shape', () => {
  it('has the same keys for a located failure', async () => {
    const report = await reportForAsync('xcodebuild-pods-out-of-sync.log');
    expect(Object.keys(report)).toEqual(TOP_LEVEL_KEYS);
  });

  it('has the same keys when nothing was located', async () => {
    const report = await reportForAsync('no-failure-successful-pod-install.log');

    expect(Object.keys(report)).toEqual(TOP_LEVEL_KEYS);
    expect(report.failure).toBeNull();
    expect(report.otherFailures).toEqual([]);
    // `failure: null` is only a usable answer with something to read next to it.
    expect(report.logTail.length).toBeGreaterThan(0);
  });

  it('gives the failure a fixed key set too', async () => {
    const report = await reportForAsync('xcodebuild-signing-no-team.log');
    expect(Object.keys(report.failure!)).toEqual([
      'phase',
      'signature',
      'line',
      'message',
      'matchedLine',
      'context',
      'confidence',
      'suggestedCommand',
      'docsUrl',
    ]);
    // Null, not absent, for a rule that has no docs page or no single next command.
    const noDocs = await reportForAsync('gradle-kotlin-compile-error.log');
    expect(noDocs.failure).toMatchObject({ docsUrl: null, suggestedCommand: null });
  });

  it('reports what was read, including what truncation dropped', async () => {
    const report = await reportForAsync('metro-syntax-error.log');
    expect(report.source).toEqual({
      kind: 'file',
      path: path.join(FIXTURES, 'metro-syntax-error.log'),
      platform: null,
      bytes: expect.any(Number),
      lines: expect.any(Number),
      truncated: false,
      droppedLines: 0,
    });
  });

  it('reports the platform hint it was given, so a reader knows the table was narrowed', async () => {
    const report = await reportForAsync('xcodebuild-signing-no-team.log', { platform: 'ios' });
    expect(report.source.platform).toBe('ios');
  });

  it('carries no path for a stdin run', async () => {
    const read = await readLogFileAsync(path.join(FIXTURES, 'metro-syntax-error.log'));
    const report = buildExplainReport(read, { ...BASE_OPTIONS, source: { kind: 'stdin' } });
    expect(report.source).toMatchObject({ kind: 'stdin', path: null });
  });

  it('is JSON with nothing in it that does not serialize', async () => {
    const report = await reportForAsync('gradle-duplicate-class.log', { all: true });
    expect(JSON.parse(JSON.stringify(report))).toEqual(report);
  });
});

describe('the report', () => {
  it('attaches the follow-ups the matched rule named', async () => {
    const report = await reportForAsync('xcodebuild-pods-out-of-sync.log');
    expect(report.followups[0]).toMatchObject({
      id: 'apply-fix',
      command: 'npx pod-install --non-interactive',
    });
  });

  it('attaches none when the caller cleared them', async () => {
    const report = await reportForAsync('xcodebuild-pods-out-of-sync.log', { followups: false });
    expect(report.followups).toEqual([]);
  });

  it('only lists other failures when --all was asked for', async () => {
    expect((await reportForAsync('gradle-kotlin-compile-error.log')).otherFailures).toEqual([]);
    expect(
      (await reportForAsync('gradle-kotlin-compile-error.log', { all: true })).otherFailures.length
    ).toBeGreaterThan(0);
  });

  it('reads the whole file through a stream, never into one string', async () => {
    // The property this command has to keep for a 100 MB Xcode log. `extract-test.ts` asserts the
    // same thing; it is repeated here because this is the path the command actually takes.
    const realFs = jest.requireActual<typeof import('fs')>('fs');
    const readFileSync = jest.spyOn(realFs, 'readFileSync');
    await reportForAsync('xcodebuild-pods-out-of-sync.log');
    expect(readFileSync).not.toHaveBeenCalled();
    readFileSync.mockRestore();
  });
});

describe('the fixtures directory', () => {
  it('has a .json expectation for every .log, and no orphans of either', () => {
    const files = fs.readdirSync(FIXTURES);
    const logs = files.filter((file) => file.endsWith('.log')).map((file) => file.slice(0, -4));
    const expectations = files
      .filter((file) => file.endsWith('.json'))
      .map((file) => file.slice(0, -5));
    expect(expectations.sort()).toEqual(logs.sort());
  });

  it('has a README that says which logs were captured and which were written', () => {
    const readme = fs.readFileSync(path.join(FIXTURES, 'README.md'), 'utf8');
    for (const file of fs.readdirSync(FIXTURES).filter((name) => name.endsWith('.log'))) {
      // Provenance per fixture, not a blanket claim: a reader must be able to tell a recording
      // from a construction without running anything.
      expect(readme).toContain(file);
    }
  });
});

// @ref llp/0012-build-explain.rfc.md §Is this a log at all — live staging, S8.
//
// A brotli-encoded EAS log saved without decoding it was read as a clean build: exit 0,
// `failure: null`, and ~10 KB of control characters in `logTail`. Nothing about that input was a
// log, and "no error located" is the one answer that must not be given for it.
describe('input that is not a log', () => {
  let temporaryDir: string;
  beforeAll(() => {
    temporaryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-cli-notalog-'));
  });
  afterAll(() => {
    fs.rmSync(temporaryDir, { recursive: true, force: true });
  });

  /** High-entropy bytes with no line structure, which is what an undecoded brotli body is. */
  function writeCompressed(): string {
    const file = path.join(temporaryDir, 'build.log.br');
    fs.writeFileSync(
      file,
      Buffer.from(Array.from({ length: 4000 }, (_unused, index) => index % 256))
    );
    return file;
  }

  it('exits 22 rather than reporting a clean build', async () => {
    const file = writeCompressed();
    const error = await explainAsync({
      ...BASE_OPTIONS,
      source: { kind: 'file', path: file },
    }).then(
      () => null,
      (caught: CommandError) => caught
    );

    expect(error).toBeInstanceOf(CommandError);
    expect(error!.code).toBe('LOG_NOT_TEXT');
    expect(error!.exitCode).toBe(EXIT_OUTCOME_TIMEOUT);
  });

  it('names brotli and the decode, because that is what EAS serves', async () => {
    const file = writeCompressed();
    const error = (await explainAsync({
      ...BASE_OPTIONS,
      source: { kind: 'file', path: file },
    }).catch((caught: CommandError) => caught)) as CommandError;

    expect(error.message).toMatch(/brotli/i);
    expect(error.message).toMatch(/Why:/);
    expect(error.message).toMatch(/How:/);
    expect(error.message).toContain(file);
  });

  it('never puts the bytes it refused into its own output', async () => {
    const file = writeCompressed();
    const error = (await explainAsync({
      ...BASE_OPTIONS,
      source: { kind: 'file', path: file },
    }).catch((caught: CommandError) => caught)) as CommandError;

    // The message says how it decided and quotes none of what it read.
    const controlCharacters = [...error.message].filter(
      (character) => character.charCodeAt(0) < 0x20 && character !== '\n'
    );
    expect(controlCharacters).toEqual([]);
  });

  it('still reads a text log that happens to be named .br', async () => {
    const file = path.join(temporaryDir, 'decoded.br');
    fs.writeFileSync(file, '> Task :app:compileDebugKotlin\nBUILD FAILED\n');

    await expect(
      explainAsync({ ...BASE_OPTIONS, source: { kind: 'file', path: file }, json: true })
    ).resolves.toBeUndefined();
  });
});
