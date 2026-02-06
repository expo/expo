#!/usr/bin/env node
import { Command } from 'commander';

import { buildAndroid, buildIos, tasksAndroid } from './commands';

const program = new Command();

// main program
program.name('expo-brownfield').version('0.0.1', '-v, --version');

// build:android
program
  .command('build:android')
  .description('Build and publish Android brownfield artifacts')
  .option('-d, --debug', 'build debug variant')
  .option('-r, --release', 'build release variant')
  .option('-a, --all', 'build both debug and release variants')
  .option('--verbose', 'forward all output to the terminal')
  .option('-l, --library <library>', 'name of the brownfield library')
  .option('-t, --task <task...>', 'publishing task to be run (multiple can be passed)')
  .option(
    '--repo, --repository <repository...>',
    'repository to publish to (multiple can be passed)'
  )
  .action(async function () {
    await buildAndroid(this);
  });

// build:ios
program
  .command('build:ios')
  .description('Build and publish iOS brownfield artifacts')
  .option('-d, --debug', 'build debug configuration')
  .option('-r, --release', 'build release configuration')
  .option('--verbose', 'forward all output to the terminal')
  .option('-s, --scheme <scheme>', 'name of the iOS scheme')
  .option('-x, --xcworkspace <xcworkspace>', 'path to the Xcode workspace (.xcworkspace)')
  .option('-a, --artifacts <artifacts>', 'path to the artifacts directory')
  .action(async function () {
    await buildIos(this);
  });

// tasks:android
program
  .command('tasks:android')
  .description('List available publishing tasks and repositories for android')
  .option('--verbose', 'forward all output to the terminal')
  .option('-l, --library <library>', 'name of the brownfield library')
  .action(async function () {
    await tasksAndroid(this);
  });

program.parse();
