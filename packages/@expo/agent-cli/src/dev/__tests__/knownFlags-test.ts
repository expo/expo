// @ref llp/0010-agent-conventions.rfc.md §The `--json` error envelope — friction run 5, F48-3.
//
// The half of this that can be wrong is the *accepting*, not the refusing: a flag missing from the
// `expo start` list turns a correct command into an error, which is the one failure mode a check
// like this must not have. So the accepted table is the long one, and it is the schema of the
// upstream command transcribed rather than a guess.

import { assertKnownDevFlags, EXPO_START_FLAGS } from '../knownFlags';
import { resolveDevOptions } from '../resolveOptions';

describe(assertKnownDevFlags, () => {
  it.each([
    ['--plan'],
    ['--yes'],
    ['--json'],
    ['--detach'],
    ['--wait-ready'],
    ['--no-agent-skills'],
    ['--no-followups'],
    ['--help'],
    ['-h'],
  ])(`accepts %s, which this command acts on itself`, (flag) => {
    expect(() => assertKnownDevFlags([flag])).not.toThrow();
  });

  it.each(EXPO_START_FLAGS.map((flag) => [flag]))(
    `accepts %s, which is forwarded to expo start`,
    (flag) => {
      expect(() => assertKnownDevFlags([flag])).not.toThrow();
    }
  );

  it(`refuses an option neither CLI has, before anything is planned`, () => {
    const error = (() => {
      try {
        assertKnownDevFlags(['--yes', '--bogus']);
      } catch (thrown: any) {
        return thrown;
      }
      return null;
    })();

    expect(error.code).toBe('BAD_ARGS');
    expect(error.message).toContain('--bogus');
    expect(error.suggestedCommand).toBe('npx @expo/agent-cli dev --help');
  });

  // The payoff of the sibling table: `--tail` is a real option of a command a caller plausibly
  // meant, so the answer is that command rather than "no such option".
  it(`names the sibling command when the option exists on one`, () => {
    expect(() => assertKnownDevFlags(['--tail'])).toThrow(/dev:logs/);
  });

  it(`reads --flag=value as the flag`, () => {
    expect(() => assertKnownDevFlags(['--port=8082'])).not.toThrow();
    expect(() => assertKnownDevFlags(['--bogus=1'])).toThrow(/--bogus/);
  });

  // A value, a positional and a lone dash are not options, and refusing any of them would refuse
  // a command that was right.
  it.each([[['--port', '8082']], [['--host', 'tunnel']], [['./some/project']], [['-']]])(
    `does not read %s as an option`,
    (argv) => {
      expect(() => assertKnownDevFlags(argv)).not.toThrow();
    }
  );

  // Everything after `--` belongs to another tool, so this command has no business judging it.
  it(`leaves everything after a -- separator alone`, () => {
    expect(() => assertKnownDevFlags(['--yes', '--', '--whatever-it-wants'])).not.toThrow();
  });
});

describe('resolveDevOptions checks the flags first', () => {
  it(`refuses an unknown option instead of forwarding it to expo start`, () => {
    expect(() => resolveDevOptions(['--yes', '--bogus'])).toThrow(/--bogus/);
  });

  // The check runs before the combination rules, so a run with two problems is told about the
  // one it can act on: an option that does not exist cannot have a meaningful interaction.
  it(`still resolves a command made only of options both CLIs have`, () => {
    const options = resolveDevOptions(['--yes', '--go', '--port', '8195', '--json']);

    expect(options.port).toBe(8195);
    expect(options.json).toBe(true);
    expect(options.expoArgs).toEqual(['--go', '--port', '8195']);
  });
});

// @ref llp/0005-runtime-loop-tools.rfc.md §Where a device reaches the dev server
//
// The whole cloud-simulator loop runs through these two spellings [observed — dogfood,
// 2026-08-24], and `EXPO_START_FLAGS` is a list a flag has to be *on*: dropped from it, a working
// command becomes `unknown or unexpected option: --tunnel`.
describe('the tunnel flags', () => {
  it.each([
    [['--tunnel']],
    [['--tunnel', '--go']],
    [['--host', 'tunnel']],
    [['--host=tunnel']],
    [['--lan']],
    [['--localhost']],
  ])(`accepts %s`, (argv) => {
    expect(() => assertKnownDevFlags(argv)).not.toThrow();
  });
});
