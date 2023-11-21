#!/usr/bin/env node
import chalk from 'chalk';
import Debug from 'debug';
import { constants, promises as fs } from 'fs';
import { boolish } from 'getenv';
import path from 'path';

import { actionAsync } from './doctor';

// Setup before requiring `debug`.
if (boolish('EXPO_DEBUG', false)) {
  Debug.enable('expo:*');
} else if (Debug.enabled('expo:')) {
  process.env.EXPO_DEBUG = '1';
}

const packageJson = () => require('../package.json');

async function run() {
  const args = process.argv.slice(2);

  if (args.some(arg => ['-v', '--version'].includes(arg))) {
    logVersionAndExit();
  }

  if (args.some(arg => ['-h', '--help'].includes(arg))) {
    logHelpAndExit();
  }

  // TODO: add offline flag

  const projectRoot = path.resolve(process.cwd(), args[0] ?? process.cwd());

  await fs.access(projectRoot, constants.F_OK).catch((err: any) => {
    if (err) {
      console.error(chalk.red(`Project directory ${projectRoot} does not exist`));
      process.exit(1);
    }
  });

  await actionAsync(projectRoot);
}

function logVersionAndExit() {
  console.log(packageJson().version);
  process.exit(0);
}

function logHelpAndExit() {
  console.log(`
  Usage: npx expo-doctor [path] [options]

  Diagnose issues with the project

  Options:

    -h, --help       output usage information
    -v, --version    output the version number`);
  process.exit(0);
}

run();
