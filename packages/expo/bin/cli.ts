#!/usr/bin/env node
import arg from 'arg';
import chalk from 'chalk';

const defaultCmd = 'config';

export type Command = (argv?: string[]) => void;

const commands: { [command: string]: () => Promise<Command> } = {
  // Add a new command here
  config: () => import('../cli/config').then((i) => i.expoConfig),
};

const args = arg(
  {
    // Types
    '--version': Boolean,
    '--help': Boolean,

    // Aliases
    '-v': '--version',
    '-h': '--help',
  },
  {
    permissive: true,
  }
);

if (args['--version']) {
  // Version is inlined into the file using taskr build pipeline
  console.log(`expo v${process.env.__EXPO_VERSION}`);
  process.exit(0);
}

// Check if we are running `npx expo <subcommand>` or `npx expo`
const targetCmd = Boolean(commands[args._[0]]);

// Handle `--help` flag
if (!targetCmd && args['--help']) {
  console.log(chalk`
    {bold Usage}
      {bold $} npx expo <command>

    {bold Available commands}
      ${Object.keys(commands).join(', ')}

    {bold Options}
      --version, -v   Version number
      --help, -h      Displays this message

    For more information run a command with the --help flag
      {bold $} expo start --help
  `);
  process.exit(0);
}

const command = targetCmd ? args._[0] : defaultCmd;
const targetArgs = targetCmd ? args._.slice(1) : args._;

// Push the help flag to the subcommand args.
if (args['--help']) {
  targetArgs.push('--help');
}

// Install exit hooks
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

commands[command]().then((exec) => exec(targetArgs));
