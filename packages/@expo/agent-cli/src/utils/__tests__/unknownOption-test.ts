import {
  argParseError,
  OPTION_OWNERS,
  siblingCommandsFor,
  unknownOptionError,
} from '../unknownOption';

describe(unknownOptionError, () => {
  it('says what, why and how, and suggests the command own help', () => {
    const error = unknownOptionError('typecheck', '--bogus');

    expect(error.code).toBe('BAD_ARGS');
    expect(error.message).toContain('Unknown option --bogus for "@expo/agent-cli typecheck"');
    expect(error.message).toContain('Why:');
    expect(error.message).toContain('How:');
    expect(error.suggestedCommand).toBe('npx @expo/agent-cli typecheck --help');
  });

  it('names the sibling command that does take the option', () => {
    const error = unknownOptionError('dev:stop', '--route');

    expect(error.message).toContain('"npx @expo/agent-cli runtime:reload"');
  });

  it('never names the command that failed as its own sibling', () => {
    expect(siblingCommandsFor('--port', 'dev:stop')).not.toContain('dev:stop');
    expect(siblingCommandsFor('--port', 'dev:stop')).toContain('dev');
  });

  it('answers an option nothing in the table owns without inventing a command', () => {
    const error = unknownOptionError('status', '--nonsense');

    expect(error.message).toContain('this command acts on the options in its own --help');
    expect(error.message).not.toContain('npx @expo/agent-cli --nonsense');
  });
});

describe(argParseError, () => {
  it('reads the option name out of the parser own sentence', () => {
    const error = argParseError(
      'dev:stop',
      'unknown or unexpected option: --bogus',
      'ARG_UNKNOWN_OPTION'
    );

    expect(error.message).toContain('--bogus');
  });

  it('tells a missing value apart from an unknown option', () => {
    const error = argParseError(
      'dev:stop',
      'option requires argument: --timeout',
      'ARG_MISSING_REQUIRED_LONGARG'
    );

    expect(error.message).toContain(
      'was passed to "@expo/agent-cli dev:stop" with nothing after it'
    );
    expect(error.message).toContain('npx @expo/agent-cli dev:stop --timeout <value>');
  });
});

describe('OPTION_OWNERS', () => {
  // The table is only useful while it is true, and it is hand-kept — so the one property worth
  // pinning is that every name in it resolves to a real command.
  it('names only commands the registry resolves', () => {
    const { resolveCommand } =
      require('../../commandRegistry') as typeof import('../../commandRegistry');
    for (const owners of Object.values(OPTION_OWNERS)) {
      for (const owner of owners) {
        expect(resolveCommand(owner, []).kind).toBe('command');
      }
    }
  });

  // @ref llp/0010-agent-conventions.rfc.md §The `--json` error envelope — friction run 5, F48-2.
  // Each of these is an option a caller reached for on a neighbour of the command that has it,
  // and the table is what turns "that option does not exist" into "it exists over there".
  it.each([
    ['--tail', 'dev:logs'],
    ['--fail-on-error', 'runtime:errors'],
    ['--duration', 'runtime:errors'],
  ])('names the command that owns %s', (option, owner) => {
    expect(OPTION_OWNERS[option]).toContain(owner);
  });

  it('points a caller who asked dev:stop for a window at runtime:errors', () => {
    const error = unknownOptionError('dev:stop', '--duration');

    expect(error.message).toContain('"npx @expo/agent-cli runtime:errors"');
  });
});
