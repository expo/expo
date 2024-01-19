#!/usr/bin/env node
import arg from 'arg';
import chalk from 'chalk';
import Debug from 'debug';
import { boolish } from 'getenv';

// Setup before requiring `debug`.
if (boolish('EXPO_DEBUG', false)) {
  Debug.enable('expo:*');
} else if (Debug.enabled('expo:')) {
  process.env.EXPO_DEBUG = '1';
}

const defaultCmd = 'start';

export type Command = (argv?: string[]) => void;

const commands: { [command: string]: () => Promise<Command> } = {
  // Add a new command here
  // NOTE(EvanBacon): Ensure every bundler-related command sets `NODE_ENV` as expected for the command.
  run: () => import('../src/run/index.js').then((i) => i.expoRun),
  'run:ios': () => import('../src/run/ios/index.js').then((i) => i.expoRunIos),
  'run:android': () => import('../src/run/android/index.js').then((i) => i.expoRunAndroid),
  start: () => import('../src/start/index.js').then((i) => i.expoStart),
  prebuild: () => import('../src/prebuild/index.js').then((i) => i.expoPrebuild),
  config: () => import('../src/config/index.js').then((i) => i.expoConfig),
  export: () => import('../src/export/index.js').then((i) => i.expoExport),
  'export:web': () => import('../src/export/web/index.js').then((i) => i.expoExportWeb),
  'export:embed': () => import('../src/export/embed/index.js').then((i) => i.expoExportEmbed),

  // Auxiliary commands
  install: () => import('../src/install/index.js').then((i) => i.expoInstall),
  add: () => import('../src/install/index.js').then((i) => i.expoInstall),
  customize: () => import('../src/customize/index.js').then((i) => i.expoCustomize),

  // Auth
  login: () => import('../src/login/index.js').then((i) => i.expoLogin),
  logout: () => import('../src/logout/index.js').then((i) => i.expoLogout),
  register: () => import('../src/register/index.js').then((i) => i.expoRegister),
  whoami: () => import('../src/whoami/index.js').then((i) => i.expoWhoami),
};

const args = arg(
  {
    // Types
    '--version': Boolean,
    '--help': Boolean,
    // NOTE(EvanBacon): This is here to silence warnings from processes that
    // expect the global expo-cli.
    '--non-interactive': Boolean,

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

if (args['--non-interactive']) {
  console.warn(chalk.yellow`  {bold --non-interactive} is not supported, use {bold $CI=1} instead`);
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
    add,
    export: _export,
    config,
    customize,
    prebuild,
    'run:ios': runIos,
    'run:android': runAndroid,
    // NOTE(EvanBacon): Don't document this command as it's a temporary
    // workaround until we can use `expo export` for all production bundling.
    // https://github.com/expo/expo/pull/21396/files#r1121025873
    'export:embed': exportEmbed_unused,
    // The export:web command is deprecated. Hide it from the help prompt.
    'export:web': exportWeb_unused,
    // Other ignored commands, these are intentially not listed in the `--help` output
    run: _run,
    // All other commands
    ...others
  } = commands;

  console.log(chalk`
  {bold Usage}
    {dim $} npx expo <command>

  {bold Commands}
    ${Object.keys({ start, export: _export, ...others }).join(', ')}
    ${Object.keys({ 'run:ios': runIos, 'run:android': runAndroid, prebuild }).join(', ')}
    ${Object.keys({ install, customize, config }).join(', ')}
    {dim ${Object.keys({ login, logout, whoami, register }).join(', ')}}

  {bold Options}
    --version, -v   Version number
    --help, -h      Usage info

  For more info run a command with the {bold --help} flag
    {dim $} npx expo start --help
`);

  process.exit(0);
}

// NOTE(EvanBacon): Squat some directory names to help with migration,
// users can still use folders named "send" or "eject" by using the fully qualified `npx expo start ./send`.
if (!isSubcommand) {
  const migrationMap: Record<string, string> = {
    init: 'npx create-expo-app',
    eject: 'npx expo prebuild',
    web: 'npx expo start --web',
    'start:web': 'npx expo start --web',
    'build:ios': 'eas build -p ios',
    'build:android': 'eas build -p android',
    'client:install:ios': 'npx expo start --ios',
    'client:install:android': 'npx expo start --android',
    doctor: 'npx expo-doctor',
    upgrade: 'https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/',
    'customize:web': 'npx expo customize',

    publish: 'eas update',
    'publish:set': 'eas update',
    'publish:rollback': 'eas update',
    'publish:history': 'eas update',
    'publish:details': 'eas update',

    'build:web': 'npx expo export:web',

    'credentials:manager': `eas credentials`,
    'fetch:ios:certs': `eas credentials`,
    'fetch:android:keystore': `eas credentials`,
    'fetch:android:hashes': `eas credentials`,
    'fetch:android:upload-cert': `eas credentials`,
    'push:android:upload': `eas credentials`,
    'push:android:show': `eas credentials`,
    'push:android:clear': `eas credentials`,
    url: `eas build:list`,
    'url:ipa': `eas build:list`,
    'url:apk': `eas build:list`,
    webhooks: `eas webhook`,
    'webhooks:add': `eas webhook:create`,
    'webhooks:remove': `eas webhook:delete`,
    'webhooks:update': `eas webhook:update`,

    'build:status': `eas build:list`,
    'upload:android': `eas submit -p android`,
    'upload:ios': `eas submit -p ios`,
  };

  // TODO: Log telemetry about invalid command used.
  const subcommand = args._[0];
  if (subcommand in migrationMap) {
    const replacement = migrationMap[subcommand];
    console.log();
    const instruction = subcommand === 'upgrade' ? 'follow this guide' : 'use'
    console.log(
      chalk.yellow`  {gray $} {bold expo ${subcommand}} is not supported in the local CLI, please ${instruction} {bold ${replacement}} instead`
    );
    console.log();
    process.exit(1);
  }
  const deprecated = ['send', 'client:ios'];
  if (deprecated.includes(subcommand)) {
    console.log();
    console.log(chalk.yellow`  {gray $} {bold expo ${subcommand}} is deprecated`);
    console.log();
    process.exit(1);
  }
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

commands[command]().then((exec) => {
  exec(commandArgs);

  if (!boolish('EXPO_NO_TELEMETRY', false)) {
    // NOTE(EvanBacon): Track some basic telemetry events indicating the command
    // that was run. This can be disabled with the $EXPO_NO_TELEMETRY environment variable.
    // We do this to determine how well deprecations are going before removing a command.
    const { logEventAsync } =
      require('../src/utils/analytics/rudderstackClient') as typeof import('../src/utils/analytics/rudderstackClient');
    logEventAsync('action', {
      action: `expo ${command}`,
      source: 'expo/cli',
      source_version: process.env.__EXPO_VERSION,
    });
  }
});
