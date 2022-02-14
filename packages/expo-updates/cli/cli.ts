#!/usr/bin/env node
import arg from 'arg';
import chalk from 'chalk';

export type Command = (argv?: string[]) => void;

const commands: { [command: string]: () => Promise<Command> } = {
  // Add a new command here
  'codesigning:generate': () => import('./generateCodeSigning').then((i) => i.generateCodeSigning),
  'codesigning:configure': () =>
    import('./configureCodeSigning').then((i) => i.configureCodeSigning),
};

const args = arg(
  {
    // Types
    '--help': Boolean,

    // Aliases
    '-h': '--help',
  },
  {
    permissive: true,
  }
);

const command = args._[0];
const commandArgs = args._.slice(1);

// Handle `--help` flag
if (args['--help'] || !command) {
  console.log(chalk`
    {bold Usage}
      {bold $} expo-updates <command>

    {bold Available commands}
      ${Object.keys(commands).sort().join(', ')}

    {bold Options}
      --help, -h      Displays this message

    For more information run a command with the --help flag
      {bold $} expo-updates codesigning:generate --help
  `);
  process.exit(0);
}

// Push the help flag to the subcommand args.
if (args['--help']) {
  commandArgs.push('--help');
}

// Install exit hooks
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

commands[command]().then((exec) => exec(commandArgs));
