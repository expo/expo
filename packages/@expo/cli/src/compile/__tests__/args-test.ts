import { CommandError } from '../../utils/errors';
import { parseCompileArgs } from '../args';

it('reports unknown flags as a command error', () => {
  expect(() => parseCompileArgs(['--configuration', 'Debug'])).toThrow(CommandError);
});

it('rejects more than one project directory', () => {
  expect(() => parseCompileArgs(['./app', './other', '--dev'])).toThrow(
    new CommandError(
      'BAD_ARGS',
      'Expected one project directory but got 2 (./app, ./other). Quote the path if it contains spaces.'
    )
  );
});
