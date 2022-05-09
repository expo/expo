#!/usr/bin/env node
import arg from 'arg';
import chalk from 'chalk';

const defaultCmd = 'start';

export type Command = (argv?: string[]) => void;

const commands: { [command: string]: () => Promise<Command> } = {
  // Add a new command here
  'run:ios': () => import('../src/run/ios').then((i) => i.expoRunIos),
  'run:android': () => import('../src/run/android').then((i) => i.expoRunAndroid),
  start: () => import('../src/start').then((i) => i.expoStart),
  prebuild: () => import('../src/prebuild').then((i) => i.expoPrebuild),
  config: () => import('../src/config').then((i) => i.expoConfig),
  export: () => import('../src/export').then((i) => i.expoExport),

  // Auxiliary commands
  install: () => import('../src/install').then((i) => i.expoInstall),
  customize: () => import('../src/customize').then((i) => i.expoCustomize),

  // Auth
  login: () => import('../src/login').then((i) => i.expoLogin),
  logout: () => import('../src/logout').then((i) => i.expoLogout),
  register: () => import('../src/register').then((i) => i.expoRegister),
  whoami: () => import('../src/whoami').then((i) => i.expoWhoami),
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
  // Version is added in the build script.
  console.log(process.env.__EXPO_VERSION);
  process.exit(0);
}

// Check if we are running `npx expo <subcommand>` or `npx expo`
const isSubcommand = Boolean(commands[args._[0]]);

// Handle `--help` flag
if (!isSubcommand && args['--help']) {
  const {
    login,
    logout,
    whoami,
    register,
    start,
    install,
    export: _export,
    config,
    prebuild,
    'run:ios': runIos,
    'run:android': runAndroid,
    ...others
  } = commands;

  console.log(chalk`
  {bold Usage}
    {dim $} npx expo <command>

  {bold Commands}
    ${Object.keys({ start, install, export: _export, config, ...others }).join(', ')}
    ${Object.keys({ 'run:ios': runIos, 'run:android': runAndroid, prebuild }).join(', ')}
    {dim ${Object.keys({ login, logout, whoami, register }).join(', ')}}

  {bold Options}
    --version, -v   Version number
    --help, -h      Usage info

  For more info run a command with the {bold --help} flag
    {dim $} npx expo start --help
`);
  process.exit(0);
}

const command = isSubcommand ? args._[0] : defaultCmd;
const commandArgs = isSubcommand ? args._.slice(1) : args._;

// Push the help flag to the subcommand args.
if (args['--help']) {
  commandArgs.push('--help');
}

// Install exit hooks
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

commands[command]().then((exec) => exec(commandArgs));
