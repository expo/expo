import {
  assertWithOptionsArgs,
  DURATION_HELP_NOTE,
  DURATION_METAVAR,
  resolveDuration,
  strayArgumentError,
} from '../args';
import { CommandError } from '../errors';

jest.mock('../errors', () => {
  const actual = jest.requireActual('../errors');
  return { ...actual, logCmdError: jest.fn() };
});

const { logCmdError } = require('../errors') as { logCmdError: jest.Mock };

const HELP_SCHEMA = { '--help': Boolean, '--id': String, '-h': '--help' };

describe(strayArgumentError, () => {
  it(`names the argument, the command, and that it would have been dropped`, () => {
    const error = strayArgumentError('checkpoint:undo', ['abc123']);
    expect(error).toBeInstanceOf(CommandError);
    expect(error.code).toBe('BAD_ARGS');
    expect(error.message).toContain('Unexpected argument: abc123');
    expect(error.message).toContain('"exagent checkpoint:undo" reads no positional arguments');
    expect(error.message).toContain('dropped');
    expect(error.suggestedCommand).toBe('npx exagent checkpoint:undo --help');
  });

  it(`counts them when more than one arrived`, () => {
    expect(strayArgumentError('status', ['a', 'b']).message).toContain('2 were passed (a b)');
  });

  it(`prints the caller's hint as the "How" line when there is one`, () => {
    const error = strayArgumentError('checkpoint:undo', ['abc123'], { hint: 'use --id.' });
    expect(error.message).toContain('How: use --id.');
  });
});

describe(assertWithOptionsArgs, () => {
  beforeEach(() => logCmdError.mockClear());

  // The whole of F22: `checkpoint:undo <id>` dropped the argument and restored the newest
  // checkpoint over the working tree, and reported that it had worked.
  //
  // Thrown rather than reported: `logCmdError` exits on a later tick, so a caller that carried on
  // ran the command body in the window before the exit fired.
  it(`throws for a stray argument on a command that reads none`, () => {
    const run = () =>
      assertWithOptionsArgs(HELP_SCHEMA, {
        argv: ['abc123'],
        command: 'checkpoint:undo',
        positionalArgs: 'none',
        strayHint: 'name it with --id.',
      });

    expect(run).toThrow(CommandError);
    expect(run).toThrow(/Unexpected argument: abc123/);
    expect(run).toThrow(/name it with --id\./);
    expect(logCmdError).not.toHaveBeenCalled();
  });

  // @ref llp/0010-agent-conventions.rfc.md §The `--json` error envelope — the parser's own
  // sentence used to reach the terminal unchanged, with no envelope behind it.
  it(`throws a CommandError for an option the command does not have`, () => {
    const run = () =>
      assertWithOptionsArgs(HELP_SCHEMA, {
        argv: ['--bogus'],
        command: 'checkpoint:undo',
        positionalArgs: 'none',
      });

    expect(run).toThrow(CommandError);
    expect(run).toThrow(/Unknown option --bogus for "exagent checkpoint:undo"/);
    expect(run).toThrow(/How: run "npx exagent checkpoint:undo --help"/);
  });

  it(`accepts a run with only options`, () => {
    const args = assertWithOptionsArgs(HELP_SCHEMA, {
      argv: ['--id', 'abc123'],
      command: 'checkpoint:undo',
      positionalArgs: 'none',
    });
    expect(args['--id']).toBe('abc123');
    expect(logCmdError).not.toHaveBeenCalled();
  });

  // A caller reading the usage is not the one this protects, and the help is the recovery it names.
  it(`prints the help rather than the error when both are asked for`, () => {
    const args = assertWithOptionsArgs(HELP_SCHEMA, {
      argv: ['abc123', '--help'],
      command: 'checkpoint:undo',
      positionalArgs: 'none',
    });
    expect(args['--help']).toBe(true);
    expect(logCmdError).not.toHaveBeenCalled();
  });

  // A permissive parse cannot tell an unrecognized flag from a positional: `arg` puts both in `_`.
  it(`leaves the arguments alone for a command that reads them itself`, () => {
    const args = assertWithOptionsArgs(HELP_SCHEMA, {
      argv: ['/profile/42', '--json'],
      permissive: true,
      command: 'navigate',
      positionalArgs: 'own',
    });
    expect(args._).toEqual(['/profile/42', '--json']);
    expect(logCmdError).not.toHaveBeenCalled();
  });
});

describe(resolveDuration, () => {
  it(`falls back when the flag was not passed`, () => {
    expect(resolveDuration(undefined, '--timeout', 5000, { allowZero: false })).toBe(5000);
    expect(resolveDuration(null, '--duration', 2000, { allowZero: true })).toBe(2000);
  });

  it(`reads the value the caller named`, () => {
    expect(resolveDuration('250', '--timeout', 5000, { allowZero: false })).toBe(250);
    expect(resolveDuration('0', '--duration', 2000, { allowZero: true })).toBe(0);
  });

  // A window that collects nothing is a usable request; a timeout of zero is a mistake.
  it(`accepts zero only where zero means something`, () => {
    expect(() => resolveDuration('0', '--timeout', 5000, { allowZero: false })).toThrow(
      /greater than 0/
    );
    expect(resolveDuration(0, '--duration', 2000, { allowZero: true })).toBe(0);
  });

  it(`rejects a negative duration whichever flag it is on`, () => {
    expect(() => resolveDuration('-1', '--duration', 2000, { allowZero: true })).toThrow(
      /--duration/
    );
    expect(() => resolveDuration('-1', '--timeout', 5000, { allowZero: false })).toThrow(
      /--timeout/
    );
  });

  // Read as a string, so the report names what the user typed instead of `NaN`.
  it(`reports an unusable value as the user typed it`, () => {
    expect.assertions(3);
    try {
      resolveDuration('nope', '--duration', 2000, { allowZero: true });
    } catch (error: any) {
      expect(error).toBeInstanceOf(CommandError);
      expect(error.code).toBe('BAD_ARGS');
      expect(error.message).toContain('got nope');
    }
  });

  it(`rejects a value that is not finite`, () => {
    expect(() => resolveDuration('Infinity', '--timeout', 5000, { allowZero: false })).toThrow(
      /--timeout/
    );
  });

  // A wait is typed by a person far more often than it is computed, and `--timeout 2700000` is
  // not a duration anyone can read back.
  it(`reads a duration spelled with a unit`, () => {
    const wait = { allowZero: false } as const;
    expect(resolveDuration('50ms', '--interval', 1, wait)).toBe(50);
    expect(resolveDuration('90s', '--timeout', 1, wait)).toBe(90_000);
    expect(resolveDuration('30m', '--timeout', 1, wait)).toBe(1_800_000);
    expect(resolveDuration('2h', '--timeout', 1, wait)).toBe(7_200_000);
    expect(resolveDuration('1.5h', '--timeout', 1, wait)).toBe(5_400_000);
  });

  // `parseInt('45min')` is 45, which would have started a 45-millisecond wait for a 45-minute one.
  it(`rejects a unit it does not know instead of truncating the number`, () => {
    for (const value of ['45min', '2 h', '10sec', '1d', 's']) {
      expect(() => resolveDuration(value, '--timeout', 5000, { allowZero: false })).toThrow(
        `got ${value}`
      );
    }
  });

  it(`names the units it accepts in the error`, () => {
    expect(() => resolveDuration('nope', '--timeout', 5000, { allowZero: false })).toThrow(/30m/);
  });
});

// A help line that says `<ms>` is the reason an agent never tries `90s`: it copies the stated type.
// The shared snippet is what every duration flag prints, so it has to agree with what the resolver
// actually accepts — and the accepted spellings are asserted above.
describe('duration help', () => {
  it(`does not spell a duration flag as milliseconds`, () => {
    expect(DURATION_METAVAR).toBe('<duration>');
    expect(DURATION_METAVAR).not.toContain('ms');
  });

  it(`names every unit the resolver accepts`, () => {
    for (const value of ['90s', '30m', '2h']) {
      expect(DURATION_HELP_NOTE).toContain(value);
      expect(resolveDuration(value, '--timeout', 1, { allowZero: false })).toBeGreaterThan(0);
    }
    expect(DURATION_HELP_NOTE).toContain('milliseconds');
  });
});
