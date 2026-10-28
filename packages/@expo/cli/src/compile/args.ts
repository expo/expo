import { parseArgs } from 'node:util';

import { CommandError } from '../utils/errors';

export function parseCompileArgs(argv: string[] = []) {
  try {
    return parseArgs({
      args: argv,
      options: {
        help: { type: 'boolean', short: 'h' },
        dev: { type: 'boolean' },
        prod: { type: 'boolean' },
        device: { type: 'string' },
        'output-dir': { type: 'string' },
        'output-type': { type: 'string' },
      },
    });
  } catch (error: any) {
    if (typeof error?.code === 'string' && error.code.startsWith('ERR_PARSE_ARGS_')) {
      throw new CommandError('BAD_ARGS', error.message);
    }
    throw error;
  }
}
