/* eslint-env jest */
// @ref llp/0012-build-explain.rfc.md
//
// `exagent build:explain` at the process boundary, through the published bin. The unit suite pins
// what the extractor answers for each committed log; this pins the things only a real process
// shows — that `--json` is one parseable object, that a piped log is read off a real pipe with no
// TTY anywhere, that a report is exit 0 even when it located nothing, and that a log that could
// not be read is exit 1 with the `--json` error envelope.
import { type ChildProcess, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import {
  bin,
  collectOutput,
  executeExagentAsync,
  setupFixtureAsync,
  waitForExitAsync,
  type ExecuteResult,
} from '../utils';

/**
 * The unit fixtures, read from where they live rather than copied.
 *
 * One set of logs with one set of expectations: an e2e copy would be a second place for a fixture
 * to drift, and these are large enough that duplicating them is not free either.
 */
const LOG_FIXTURES = path.resolve(__dirname, '../../src/builds/explain/__tests__/fixtures');

function fixture(name: string): string {
  return path.join(LOG_FIXTURES, name);
}

/** The shape `build:explain --json` prints, per `src/builds/explain/types.ts`. */
type ExplainReport = {
  source: {
    kind: 'file' | 'stdin';
    path: string | null;
    platform: 'ios' | 'android' | null;
    bytes: number;
    lines: number;
    truncated: boolean;
    droppedLines: number;
  };
  phases: {
    name: string;
    status: string;
    startLine: number;
    endLine: number;
  }[];
  failure: {
    phase: string;
    signature: string;
    line: number;
    message: string;
    matchedLine: string;
    context: { before: string[]; match: string; after: string[] };
    confidence: string;
    suggestedCommand: string | null;
    docsUrl: string | null;
  } | null;
  otherFailures: { signature: string; line: number }[];
  logTail: string;
  followups: { id: string; command: string; why: string }[];
};

/**
 * Run the CLI with a log written to its stdin, over a real pipe.
 *
 * The shared `spawnExagent` wires stdin to `ignore`, which is the right default for every other
 * command and is exactly what this one must not be tested with: `--stdin` reading `/dev/null`
 * would pass whatever the pipe handling did.
 */
async function pipeIntoExagentAsync(
  cwd: string,
  args: string[],
  input: string,
  env: Record<string, string> = {}
): Promise<ExecuteResult> {
  const { npm_config_minimum_release_age, ...processEnv } = process.env;
  const child: ChildProcess = spawn(process.execPath, [bin, ...args], {
    cwd,
    env: { ...processEnv, CI: '1', FORCE_COLOR: '0', NO_COLOR: '1', ...env },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const output = collectOutput(child);
  child.stdin!.end(input);
  return waitForExitAsync(child, output);
}

/** Every JSONL event of one run, as `2g` wrote them. */
function readEvents(eventsFile: string): Record<string, any>[] {
  return fs
    .readFileSync(eventsFile, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

describe('exagent build:explain --file', () => {
  it('reports the failure in a real xcodebuild log, and exits 0', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(projectRoot, [
      'build:explain',
      '--file',
      fixture('xcodebuild-pods-out-of-sync.log'),
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('ios.pods.sandbox-out-of-sync');
    expect(result.stdout).toContain('xcodebuild');
    // The quoted line, from the log, with its number: the whole claim of the command is that
    // nothing has to be taken on trust.
    expect(result.stdout).toContain('231');
    expect(result.stdout).toContain('The sandbox is not in sync with the Podfile.lock');
    expect(result.stdout).toContain('npx pod-install --non-interactive');
  });

  it('prints exactly one JSON object under --json, with the progress on the event stream', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const eventsFile = path.join(projectRoot, 'events.jsonl');

    const result = await executeExagentAsync(
      projectRoot,
      ['build:explain', '--file', fixture('metro-unresolved-module.log'), '--json'],
      { env: { LOG_EVENTS: eventsFile } }
    );

    // One object and nothing else: a `JSON.parse` of the whole stream is the assertion.
    const report: ExplainReport = JSON.parse(result.stdout);
    expect(result.stdout.trim().startsWith('{')).toBe(true);
    expect(result.stdout.trim().endsWith('}')).toBe(true);
    // The follow-up section is a terminal affordance and stays off stdout here.
    expect(result.stdout).not.toContain('Suggested next:');

    expect(report.failure).toMatchObject({
      phase: 'bundle-js',
      signature: 'bundle.unresolved-module',
      confidence: 'high',
    });
    expect(report.source).toMatchObject({ kind: 'file', truncated: false });
    // Real ANSI in the recording, and none of it in the payload.
    expect(JSON.stringify(report)).not.toMatch(/\[/);

    const events = readEvents(eventsFile);
    expect(events.find((entry) => entry._e === 'cli:build_explain')).toMatchObject({
      source: 'file',
      signature: 'bundle.unresolved-module',
      confidence: 'high',
    });
  });

  it('suggests a re-run that actually runs', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const logPath = fixture('gradle-kotlin-compile-error.log');

    const first: ExplainReport = JSON.parse(
      (await executeExagentAsync(projectRoot, ['build:explain', '--file', logPath, '--json']))
        .stdout
    );
    const rerun = first.followups.find((followup) => followup.id === 'explain-all')!;

    // A follow-up is the next thing to *run* (llp/0009), so the suggested command is executed
    // here rather than pattern-matched: a rung that dropped `--file` would read this run's stdin
    // and fail with BAD_ARGS, and a substring assertion would not notice.
    expect(rerun.command).toContain(logPath);
    const args = rerun.command.replace(/^npx exagent /, '').split(' ');
    const result = await executeExagentAsync(projectRoot, [...args, '--json']);

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout).otherFailures.length).toBeGreaterThan(0);
  });

  it('exits 0 with failure: null for a log that holds no failure', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    // A pod install that printed eight `[!]` warnings and succeeded. "No error located" is a
    // report, and a report is exit 0 (llp/0012 §Exit codes).
    const result = await executeExagentAsync(projectRoot, [
      'build:explain',
      '--file',
      fixture('no-failure-successful-pod-install.log'),
      '--json',
    ]);

    expect(result.exitCode).toBe(0);
    const report: ExplainReport = JSON.parse(result.stdout);
    expect(report.failure).toBeNull();
    expect(report.logTail.length).toBeGreaterThan(0);
  });

  it('lists the other matches only when --all is passed', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const args = ['build:explain', '--file', fixture('gradle-kotlin-compile-error.log'), '--json'];

    const plain: ExplainReport = JSON.parse((await executeExagentAsync(projectRoot, args)).stdout);
    const all: ExplainReport = JSON.parse(
      (await executeExagentAsync(projectRoot, [...args, '--all'])).stdout
    );

    expect(plain.otherFailures).toEqual([]);
    expect(all.otherFailures.length).toBeGreaterThan(0);
    expect(all.failure!.signature).toBe('android.kotlin.compile-error');
  });
});

describe('exagent build:explain --stdin', () => {
  it('reads a log off a pipe, with no TTY anywhere', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const log = fs.readFileSync(fixture('npm-package-not-found.log'), 'utf8');

    const result = await pipeIntoExagentAsync(
      projectRoot,
      ['build:explain', '--stdin', '--json'],
      log
    );

    expect(result.exitCode).toBe(0);
    const report: ExplainReport = JSON.parse(result.stdout);
    expect(report.source).toMatchObject({ kind: 'stdin', path: null });
    expect(report.failure).toMatchObject({
      phase: 'install-dependencies',
      signature: 'deps.package-not-found',
    });
  });

  it('implies --stdin when something is piping in and no source was named', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const log = fs.readFileSync(fixture('gradle-duplicate-class.log'), 'utf8');

    const result = await pipeIntoExagentAsync(projectRoot, ['build:explain', '--json'], log);

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout).failure.signature).toBe('android.gradle.duplicate-class');
  });

  it('reads a log arriving in many small writes', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const log = fs.readFileSync(fixture('xcodebuild-swift-compile-error.log'), 'utf8');

    // A chunk boundary lands in the middle of a line here, which is what a real subprocess pipe
    // does and what a naive reader gets wrong.
    const { npm_config_minimum_release_age, ...processEnv } = process.env;
    const child = spawn(process.execPath, [bin, 'build:explain', '--stdin', '--json'], {
      cwd: projectRoot,
      env: { ...processEnv, CI: '1', FORCE_COLOR: '0', NO_COLOR: '1' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const output = collectOutput(child);
    for (let offset = 0; offset < log.length; offset += 37) {
      child.stdin!.write(log.slice(offset, offset + 37));
    }
    child.stdin!.end();
    const result = await waitForExitAsync(child, output);

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout).failure.signature).toBe('ios.swift.compile-error');
  });

  it('exits 1 when nothing arrives, rather than reporting a clean log', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    // The shared runner wires stdin to `ignore`, so this is a run with stdin at EOF and no TTY —
    // exactly the "the log never arrived" case.
    const result = await executeExagentAsync(projectRoot, ['build:explain', '--json'], {
      reject: false,
    });

    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stdout).error).toMatchObject({
      code: 'EMPTY_LOG',
    });
    expect(result.stderr).toContain('An empty log is not a log with no errors in it');
  });
});

describe('when no report can be produced', () => {
  it('exits 1 with the --json error envelope for a file that is not there', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const eventsFile = path.join(projectRoot, 'events.jsonl');

    const result = await executeExagentAsync(
      projectRoot,
      ['build:explain', '--file', path.join(projectRoot, 'nope.log'), '--json'],
      { reject: false, env: { LOG_EVENTS: eventsFile } }
    );

    expect(result.exitCode).toBe(1);
    // Under `--json` the caller has committed to parsing stdout, so a failure prints one object
    // there too (llp/0010 §The `--json` error envelope).
    expect(JSON.parse(result.stdout)).toEqual({
      error: {
        code: 'LOG_UNREADABLE',
        message: expect.stringContaining('there is nothing at that path'),
        suggestedCommand: 'npx exagent build:explain --help',
        needsHuman: null,
      },
    });

    const events = readEvents(eventsFile);
    expect(events.find((entry) => entry._e === 'cli:error')).toMatchObject({
      code: 'LOG_UNREADABLE',
      suggestedCommand: 'npx exagent build:explain --help',
    });
  });

  it('says what the reserved build-id argument needs, rather than dropping it', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const buildId = '2f1c9f0e-6b1e-4a3d-9c1a-0b6f1e2d3c4a';

    const result = await executeExagentAsync(projectRoot, ['build:explain', buildId], {
      reject: false,
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("cannot fetch a build's logs yet");
    // The two forms that do work, and the command that finds the log, in the lines a reader acts on.
    expect(result.stderr).toContain('--file');
    expect(result.stderr).toContain(`Try: npx eas build:view ${buildId}`);
  });

  it('reports an unknown flag rather than ignoring it', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(
      projectRoot,
      ['build:explain', '--file', fixture('npm-peer-conflict.log'), '--bogus'],
      { reject: false }
    );

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('--bogus');
  });
});

describe('the registry', () => {
  it('lists build:explain in the group', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['build', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('build:explain');
    expect(result.stdout).toContain('build:wait');
  });

  it('prints usage for --help without reading anything', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['build:explain', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('--file <path>');
    expect(result.stdout).toContain('--stdin');
    // The reserved form is documented where a caller looks before typing it.
    expect(result.stdout).toContain('is reserved and does not work yet');
  });
});
