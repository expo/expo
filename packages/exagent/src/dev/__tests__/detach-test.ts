// @ref llp/0004-smart-start-and-project-state.rfc.md §Daemonization
//
// The two halves of detaching that a unit test can see: the command line the child is started
// with, and the log file the output goes to. The spawn itself — `detached`, `unref`, the file
// descriptors — is the e2e test's, because nothing about it is true until a real process runs.

import { vol } from 'memfs';

import { buildDetachSpawn } from '../detachAsync';
import { detachedLogPath, openDetachedLogSync, readDetachedLogSync } from '../logFile';
import { resolveDevLogsOptions, DEFAULT_LOG_TAIL_LINES } from '../resolveLogsOptions';
import { resolveDevOptions } from '../resolveOptions';

const projectRoot = '/project';

afterEach(() => vol.reset());

describe(buildDetachSpawn, () => {
  it(`runs this CLI again, on this process' own Node`, () => {
    const spawn = buildDetachSpawn('/bin/exagent.js', ['--yes']);

    expect(spawn.command).toBe(process.execPath);
    expect(spawn.args).toEqual(['/bin/exagent.js', 'dev', '--yes']);
  });

  // The one thing that must not survive: a child given `--detach` would detach a detached run.
  it(`strips --detach, so the child is the run`, () => {
    expect(buildDetachSpawn('/bin/exagent.js', ['--detach', '--yes']).args).not.toContain(
      '--detach'
    );
  });

  // The wait is the parent's, and the child has nobody to report it to.
  it(`strips --wait-ready`, () => {
    expect(buildDetachSpawn('/bin/exagent.js', ['--detach', '--wait-ready']).args).not.toContain(
      '--wait-ready'
    );
  });

  // `--json` in the child would switch the plan's subprocess output to `capture` — which is the
  // very output the log file exists to hold — and print an object nobody would ever read.
  it(`strips --json, because the parent owns stdout`, () => {
    expect(buildDetachSpawn('/bin/exagent.js', ['--detach', '--json']).args).not.toContain(
      '--json'
    );
  });

  it(`keeps everything the dev server needs`, () => {
    const { args } = buildDetachSpawn('/bin/exagent.js', [
      '--detach',
      '--yes',
      '--port',
      '8195',
      '--ios',
      '--no-agent-skills',
    ]);

    expect(args).toEqual([
      '/bin/exagent.js',
      'dev',
      '--yes',
      '--port',
      '8195',
      '--ios',
      '--no-agent-skills',
    ]);
  });

  it(`is what resolveDevOptions hands it`, () => {
    const options = resolveDevOptions(['--detach', '--wait-ready', '--yes', '--port', '8195']);

    expect(options.detach).toBe(true);
    expect(options.waitReady).toBe(true);
    expect(buildDetachSpawn('/bin/exagent.js', options.detachArgv).args).toEqual([
      '/bin/exagent.js',
      'dev',
      '--yes',
      '--port',
      '8195',
    ]);
  });
});

describe('the detach flags', () => {
  it(`refuses --wait-ready without --detach, which would wait for nothing`, () => {
    expect(() => resolveDevOptions(['--wait-ready'])).toThrow(/only means something with --detach/);
  });

  it(`refuses --plan with --detach, which would run nothing`, () => {
    expect(() => resolveDevOptions(['--plan', '--detach'])).toThrow(/opposite things/);
  });
});

describe(readDetachedLogSync, () => {
  it(`answers null for a project that has never detached one`, () => {
    vol.fromJSON({ [`${projectRoot}/package.json`]: '{}' });

    expect(readDetachedLogSync(projectRoot, 10)).toBeNull();
  });

  it(`reads the last lines, oldest first`, () => {
    vol.fromJSON({ [detachedLogPath(projectRoot)]: 'one\ntwo\nthree\nfour\n' });

    expect(readDetachedLogSync(projectRoot, 2)).toEqual({
      logFile: detachedLogPath(projectRoot),
      lines: ['three', 'four'],
      totalLines: 4,
      truncated: true,
    });
  });

  it(`says so when it is showing the whole file`, () => {
    vol.fromJSON({ [detachedLogPath(projectRoot)]: 'one\ntwo\n' });

    expect(readDetachedLogSync(projectRoot, 100)).toMatchObject({
      lines: ['one', 'two'],
      truncated: false,
    });
  });

  // Metro colours its output and draws progress bars with cursor moves. Neither is text.
  it(`strips the escape codes a bundler writes`, () => {
    vol.fromJSON({
      [detachedLogPath(projectRoot)]: '[32mBundled 1200ms[0m\n',
    });

    expect(readDetachedLogSync(projectRoot, 10)!.lines).toEqual(['Bundled 1200ms']);
  });

  it(`truncates the file for a new run`, () => {
    vol.fromJSON({ [detachedLogPath(projectRoot)]: 'from the last run\n' });

    const { logFile } = openDetachedLogSync(projectRoot);

    expect(logFile).toBe(detachedLogPath(projectRoot));
    expect(readDetachedLogSync(projectRoot, 10)!.lines).toEqual([]);
  });

  it(`creates the log directory when the project has none`, () => {
    vol.fromJSON({ [`${projectRoot}/package.json`]: '{}' });

    expect(() => openDetachedLogSync(projectRoot)).not.toThrow();
    expect(readDetachedLogSync(projectRoot, 10)).not.toBeNull();
  });
});

describe(resolveDevLogsOptions, () => {
  it(`defaults to the last ${DEFAULT_LOG_TAIL_LINES} lines`, () => {
    expect(resolveDevLogsOptions([])).toEqual({
      tail: DEFAULT_LOG_TAIL_LINES,
      json: false,
      followups: true,
    });
  });

  it(`reads --tail`, () => {
    expect(resolveDevLogsOptions(['--tail', '30']).tail).toBe(30);
  });

  it.each([['0'], ['lots'], ['1.5'], ['999999999']])(`rejects --tail %p`, (value) => {
    expect(() => resolveDevLogsOptions(['--tail', value])).toThrow(/--tail must be a whole number/);
  });

  // The parser gets this one first: `-5` reads as a flag, so `--tail` was given no value at all.
  it(`rejects --tail with a negative, as a value that never arrived`, () => {
    expect(() => resolveDevLogsOptions(['--tail', '-5'])).toThrow(/with nothing after it/);
  });

  it(`rejects a bare number, and names the flag that takes one`, () => {
    expect(() => resolveDevLogsOptions(['30'])).toThrow(/--tail 30/);
  });
});
