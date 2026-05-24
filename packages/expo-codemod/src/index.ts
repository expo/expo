import path from 'path';
import { parseArgs } from 'util';

import * as Log from './log';

export type Command = (argv?: string[]) => Promise<void>;

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  // strict:false so unknown flags pass through to the inner runCommand parser,
  // which owns the strict validation.
  const { values } = parseArgs({
    args: argv,
    options: {
      version: { type: 'boolean', short: 'v' },
    },
    allowPositionals: true,
    strict: false,
  });

  if (values.version) {
    // After build, this file is at build/index.js, so the package root is one level up.
    const pkg = require(path.resolve(__dirname, '..', 'package.json'));
    Log.log(pkg.version);
    process.exit(0);
  }

  const { runCommand } = await import('./run/index.js');
  await runCommand(argv);
}

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  Log.error(message);
  process.exit(1);
});
