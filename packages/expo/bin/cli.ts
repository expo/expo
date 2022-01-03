#!/usr/bin/env node
import arg from 'arg';
import chalk from 'chalk';

['react', 'react-native'].forEach((dependency) => {
  try {
    // When 'npm link' is used it checks the clone location. Not the project.
    require.resolve(dependency);
  } catch (err) {
    console.warn(
      `The module '${dependency}' was not found. Expo requires that you include it in 'dependencies' of your 'package.json'. To add it, run 'npm install ${dependency}'`
    );
  }
});

const defaultCommand = 'config';
export type cliCommand = (argv?: string[]) => void;
const commands: { [command: string]: () => Promise<cliCommand> } = {
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

// Version is inlined into the file using taskr build pipeline
if (args['--version']) {
  console.log(`expo v${process.env.__EXPO_VERSION}`);
  process.exit(0);
}

// Check if we are running `expo <subcommand>` or `expo`
const foundCommand = Boolean(commands[args._[0]]);

// Makes sure the `expo --help` case is covered
// This help message is only showed for `expo --help`
// `expo <subcommand> --help` falls through to be handled later
if (!foundCommand && args['--help']) {
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

const command = foundCommand ? args._[0] : defaultCommand;
const forwardedArgs = foundCommand ? args._.slice(1) : args._;

// Make sure the `expo <subcommand> --help` case is covered
if (args['--help']) {
  forwardedArgs.push('--help');
}

// Make sure commands gracefully respect termination signals (e.g. from Docker)
process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

commands[command]().then((exec) => exec(forwardedArgs));
