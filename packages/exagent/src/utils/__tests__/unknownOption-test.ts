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
    expect(error.message).toContain('Unknown option --bogus for "exagent typecheck"');
    expect(error.message).toContain('Why:');
    expect(error.message).toContain('How:');
    expect(error.suggestedCommand).toBe('npx exagent typecheck --help');
  });

  it('names the sibling command that does take the option', () => {
    const error = unknownOptionError('build:wait', '--route');

    expect(error.message).toContain('"npx exagent runtime:reload"');
  });

  it('never names the command that failed as its own sibling', () => {
    expect(siblingCommandsFor('--port', 'dev:wait')).not.toContain('dev:wait');
    expect(siblingCommandsFor('--port', 'dev:wait')).toContain('dev');
  });

  it('answers an option nothing in the table owns without inventing a command', () => {
    const error = unknownOptionError('status', '--nonsense');

    expect(error.message).toContain('this command acts on the options in its own --help');
    expect(error.message).not.toContain('npx exagent --nonsense');
  });
});

describe(argParseError, () => {
  it('reads the option name out of the parser own sentence', () => {
    const error = argParseError(
      'dev:wait',
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

    expect(error.message).toContain('was passed to "exagent dev:stop" with nothing after it');
    expect(error.message).toContain('npx exagent dev:stop --timeout <value>');
  });
});

describe('OPTION_OWNERS', () => {
  // The table is only useful while it is true, and it is hand-kept — so the one property worth
  // pinning is that every name in it resolves to a real command.
  it('names only commands the registry resolves', () => {
    const { resolveCommand } = require('../../commandRegistry') as typeof import('../../commandRegistry');
    for (const owners of Object.values(OPTION_OWNERS)) {
      for (const owner of owners) {
        expect(resolveCommand(owner, []).kind).toBe('command');
      }
    }
  });
});
