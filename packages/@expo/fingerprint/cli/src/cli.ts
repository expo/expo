#!/usr/bin/env node
import arg from 'arg';
import chalk from 'chalk';
import Debug from 'debug';
import { boolish } from 'getenv';

import { runLegacyCLIAsync } from './runLegacyCLIAsync';
import { logCmdError } from './utils/errors';
import * as Log from './utils/log';

// Setup before requiring `debug`.
if (boolish('EXPO_DEBUG', false)) {
  Debug.enable('@expo/fingeprint:*');
} else if (Debug.enabled('@expo/fingeprint:')) {
  process.env.EXPO_DEBUG = '1';
}

export type Command = (argv?: string[]) => void;

const commands: { [command: string]: () => Promise<Command> } = {
  // Add a new command here
  'fingerprint:generate': () =>
    import('./commands/generateFingerprint.js').then((i) => i.generateFingerprintAsync),
  'fingerprint:diff': () =>
    import('./commands/diffFingerprints.js').then((i) => i.diffFingerprintsAsync),
};

const args = arg(
  {
    // Types
    '--version': Boolean,
    '--help': Boolean,

    // Aliases
    '-h': '--help',
  },
  {
    permissive: true,
  }
);

if (args['--version']) {
  // Version is added in the build script.
  const packageJSON = require('../../package.json');
  console.log(packageJSON.version);
  process.exit(0);
}

const command = args._[0];
const commandArgs = args._.slice(1);

// Handle `--help` flag
if ((args['--help'] && !command) || !command) {
  Log.exit(
    chalk`
{bold Usage}
  {dim $} npx @expo/fingeprint <command>

{bold Commands}
  ${Object.keys(commands).sort().join(', ')}

{bold Options}
  --help, -h      Displays this message

For more information run a command with the --help flag
  {dim $} npx @expo/fingeprint fingerprint:generate --help
  `,
    0
  );
}

// Push the help flag to the subcommand args.
if (args['--help']) {
  commandArgs.push('--help');
}

// Install exit hooks
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

if (!(command in commands)) {
  runLegacyCLIAsync(args._).catch(logCmdError);
} else {
  commands[command]()
    .then((exec) => exec(commandArgs))
    .catch(logCmdError);
}
