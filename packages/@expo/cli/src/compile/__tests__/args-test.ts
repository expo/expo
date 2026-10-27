import { CommandError } from '../../utils/errors';
import { parseCompileArgs } from '../args';

it('reports unknown flags as a command error', () => {
  expect(() => parseCompileArgs(['--configuration', 'Debug'])).toThrow(CommandError);
});

it('rejects a project directory', () => {
  expect(() => parseCompileArgs(['./app', '--dev'])).toThrow(
    new CommandError(
      'BAD_ARGS',
      "Unexpected argument './app'. This command does not take positional arguments"
    )
  );
});
