#!/usr/bin/env node
import arg from 'arg';
import chalk from 'chalk';
import Debug from 'debug';
import { boolish } from 'getenv';

import { logCmdError } from './utils/errors';
import * as Log from './utils/log';

// Setup before requiring `debug`.
if (boolish('EXPO_DEBUG', false)) {
  Debug.enable('expo-updates:*');
} else if (Debug.enabled('expo-updates:')) {
  process.env.EXPO_DEBUG = '1';
}

export type Command = (argv?: string[]) => void;

const commands: { [command: string]: () => Promise<Command> } = {
  // Add a new command here
  'codesigning:generate': () =>
    import('./generateCodeSigning.js').then((i) => i.generateCodeSigning),
  'codesigning:configure': () =>
    import('./configureCodeSigning.js').then((i) => i.configureCodeSigning),
  'assets:verify': () => import('./assetsVerify.js').then((i) => i.expoAssetsVerify),
  'fingerprint:generate': () =>
    import('./generateFingerprint.js').then((i) => i.generateFingerprint),
  'runtimeversion:resolve': () =>
    import('./resolveRuntimeVersion.js').then((i) => i.resolveRuntimeVersion),
  'configuration:syncnative': () =>
    import('./syncConfigurationToNative.js').then((i) => i.syncConfigurationToNative),
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
  {dim $} npx expo-updates <command>

{bold Commands}
  ${Object.keys(commands).sort().join(', ')}

{bold Options}
  --help, -h      Displays this message

For more information run a command with the --help flag
  {dim $} npx expo-updates codesigning:generate --help
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
  console.error(`Invalid command: ${command}`);
  process.exit(1);
}

commands[command]()
  .then((exec) => exec(commandArgs))
  .catch(logCmdError);
