import { parseArgs } from 'node:util';

import type { Command } from '../../index';
import { reportError } from '../utils';
import { getHelp } from './help';

export const expoCommandEvents: Command = async (argv = []) => {
  try {
    const { values, positionals } = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        since: { type: 'string' },
        filter: { type: 'string', multiple: true },
        spans: { type: 'boolean' },
        tail: { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
      },
    });
    if (values.help) {
      process.stdout.write(getHelp());
      return;
    }
    const { resolveOptions } = await import('./resolveOptions.js');
    const options = resolveOptions(values, positionals);
    const { eventsAsync } = await import('./eventsAsync.js');
    await eventsAsync(options);
  } catch (error) {
    reportError(error);
  }
};
