#!/usr/bin/env node
import arg from 'arg';
import chalk from 'chalk';

import { Command } from '../../bin/cli';

export const expoAux: Command = async (argv) => {
  const commands: { [command: string]: () => Promise<Command> } = {
    // Add a new command here
    client: () => import('./client').then((i) => i.expoAuxClient),
  };

  const args = arg(
    {
      // Types
      '--help': Boolean,

      // Aliases
      '-h': '--help',
    },
    {
      argv,
      permissive: true,
    }
  );

  // Check if we are running `npx expo aux <subcommand>` or `npx expo`
  const isSubcommand = Boolean(commands[args._[0]]);

  // Handle `--help` flag
  if (!isSubcommand && args['--help']) {
    console.log(chalk`
    {bold Usage}
      {dim $} npx expo aux <command>
  
    {bold Commands}
      ${Object.keys(commands).join(', ')}
  
    {bold Options}
      --help, -h      Usage info
  
    For more info run a command with the {bold --help} flag
      {dim $} npx expo aux client --help
  `);
    process.exit(0);
  }

  const command = isSubcommand ? args._[0] : 'client';
  const commandArgs = isSubcommand ? args._.slice(1) : args._;

  // Push the help flag to the subcommand args.
  if (args['--help']) {
    commandArgs.push('--help');
  }

  commands[command]().then((exec) => exec(commandArgs));
};
