import { parseArgs } from 'node:util';

import type { Command } from '../../index';
import { installOutputErrorHandler, reportError } from '../utils';
import { getHelp } from './help';

export const expoCommandPs: Command = async (argv = []) => {
  installOutputErrorHandler();
  try {
    const { values, positionals } = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        active: { type: 'boolean', short: 'a' },
        json: { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
      },
    });
    if (values.help) {
      process.stdout.write(getHelp());
      return;
    }
    const { resolveOptions } = await import('./resolveOptions.js');
    const options = resolveOptions(values, positionals);
    const { psAsync } = await import('./psAsync.js');
    await psAsync(options);
  } catch (error) {
    reportError(error);
  }
};
