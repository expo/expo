/* eslint-env jest */
// @ref llp/0011-build-explain.rfc.md §Two input sources, and one that is reserved
// The resolver is pure — argv and two facts about the environment in, options out — so every
// combination a caller can type is asserted here, without a log and without a process.

import { DEFAULT_CONTEXT_AFTER, DEFAULT_CONTEXT_BEFORE } from '../extract';
import { resolveExplainOptions } from '../resolveOptions';

const PIPED = { stdinIsTTY: false, cwd: '/project' };
const TERMINAL = { stdinIsTTY: true, cwd: '/project' };

describe('the input source', () => {
  it('reads the file the caller named, resolved against the working directory', () => {
    expect(resolveExplainOptions(['--file', 'logs/build.log'], TERMINAL).source).toEqual({
      kind: 'file',
      path: '/project/logs/build.log',
    });
  });

  it('leaves an absolute path alone', () => {
    expect(resolveExplainOptions(['--file', '/tmp/build.log'], TERMINAL).source).toEqual({
      kind: 'file',
      path: '/tmp/build.log',
    });
  });

  it('reads stdin when asked, even on a terminal', () => {
    expect(resolveExplainOptions(['--stdin'], TERMINAL).source).toEqual({ kind: 'stdin' });
  });

  it('implies --stdin when something is piping in', () => {
    // `npx expo run:ios 2>&1 | npx exagent build:explain` is the shape the command is for, and
    // making the caller also type `--stdin` would be a flag that only ever has one value.
    expect(resolveExplainOptions([], PIPED).source).toEqual({ kind: 'stdin' });
  });

  it('refuses to wait on a stdin nobody will write to', () => {
    expect(() => resolveExplainOptions([], TERMINAL)).toThrow(/stdin is a terminal/);
  });

  it('refuses two sources rather than picking one', () => {
    expect(() => resolveExplainOptions(['--file', 'a.log', '--stdin'], PIPED)).toThrow(
      /Both --file and --stdin/
    );
  });
});

describe('the reserved build-id positional', () => {
  const BUILD_ID = '2f1c9f0e-6b1e-4a3d-9c1a-0b6f1e2d3c4a';

  it('is a clear error, not a dropped argument', () => {
    // llp/0010 §Registry rules (d): an argument a command has no place for is an error. Here it
    // also has a *reason*, which is what separates this from a typo.
    expect(() => resolveExplainOptions([BUILD_ID], PIPED)).toThrow(/cannot fetch a build's logs/);
  });

  it('carries its own code, so an agent can branch on "not yet" rather than on "bad flag"', () => {
    try {
      resolveExplainOptions([BUILD_ID], PIPED);
      throw new Error('expected a throw');
    } catch (error: any) {
      expect(error.code).toBe('BUILD_ID_UNSUPPORTED');
      expect(error.suggestedCommand).toBe(`npx eas build:view ${BUILD_ID}`);
      // The two forms that do work, in the line a reader acts on.
      expect(error.message).toContain('--file');
      expect(error.message).toContain('build:explain');
    }
  });
});

describe('--platform', () => {
  it.each(['ios', 'android', 'iOS', 'ANDROID'])('accepts %p', (value) => {
    expect(resolveExplainOptions(['--platform', value], PIPED).platform).toBe(value.toLowerCase());
  });

  it('is null when the caller named none, so every rule runs', () => {
    expect(resolveExplainOptions([], PIPED).platform).toBeNull();
  });

  it('refuses a platform this command has no rules for', () => {
    expect(() => resolveExplainOptions(['--platform', 'web'], PIPED)).toThrow(
      /not a platform this command knows/
    );
  });
});

describe('--context', () => {
  it('defaults to more after the match than before it', () => {
    const options = resolveExplainOptions([], PIPED);
    expect(options.contextBefore).toBe(DEFAULT_CONTEXT_BEFORE);
    expect(options.contextAfter).toBe(DEFAULT_CONTEXT_AFTER);
  });

  it('takes one number for both sides', () => {
    expect(resolveExplainOptions(['--context', '12'], PIPED)).toMatchObject({
      contextBefore: 12,
      contextAfter: 12,
    });
  });

  it('takes two, so the asymmetry can be kept while the size changes', () => {
    expect(resolveExplainOptions(['--context', '4:40'], PIPED)).toMatchObject({
      contextBefore: 4,
      contextAfter: 40,
    });
  });

  it('accepts zero, which is the report with no context at all', () => {
    expect(resolveExplainOptions(['--context', '0'], PIPED)).toMatchObject({
      contextBefore: 0,
      contextAfter: 0,
    });
  });

  it.each(['lots', '4:', '1:2:3', ''])('refuses %p', (value) => {
    expect(() => resolveExplainOptions(['--context', value], PIPED)).toThrow(/is not a line count/);
  });

  it('refuses a negative, which the parser sees as another flag', () => {
    // `arg` reads `-3` as an option, so this arrives as "--context had no value" rather than as a
    // bad line count. Both are `BAD_ARGS` and both name `--context`, which is what a reader needs.
    expect(() => resolveExplainOptions(['--context', '-3'], PIPED)).toThrow(/--context/);
  });
});

describe('the rest of the flags', () => {
  it('defaults to a human report with follow-ups and one failure', () => {
    expect(resolveExplainOptions([], PIPED)).toMatchObject({
      all: false,
      json: false,
      followups: true,
    });
  });

  it('reads --all, --json and --no-followups', () => {
    expect(resolveExplainOptions(['--all', '--json', '--no-followups'], PIPED)).toMatchObject({
      all: true,
      json: true,
      followups: false,
    });
  });

  it('reads the short aliases', () => {
    expect(resolveExplainOptions(['-f', 'a.log', '-p', 'ios'], TERMINAL)).toMatchObject({
      source: { kind: 'file', path: '/project/a.log' },
      platform: 'ios',
    });
  });

  it('reports an unknown flag rather than ignoring it', () => {
    expect(() => resolveExplainOptions(['--bogus'], PIPED)).toThrow(/--bogus/);
  });
});
