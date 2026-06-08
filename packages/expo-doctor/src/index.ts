#!/usr/bin/env node
import chalk from 'chalk';
import Debug from 'debug';
import { constants, promises as fs } from 'fs';
import { boolish } from 'getenv';
import path from 'path';

import { actionAsync } from './doctor';

// Check Node.js version and issue a loud warning if it's too outdated
// This is sent to stderr (console.error) so it doesn't interfere with programmatic commands
const NODE_MIN = [20, 19, 4] as const;
const nodeVersion = process.version?.slice(1).split('.', 3).map(Number);
if (
  nodeVersion[0]! < NODE_MIN[0] ||
  (nodeVersion[0] === NODE_MIN[0] && nodeVersion[1]! < NODE_MIN[1])
) {
  console.error(
    chalk.red`{bold Node.js (${process.version}) is outdated and unsupported.}` +
      chalk.red` Please update to a newer Node.js LTS version (required: >=${NODE_MIN.join('.')})\n` +
      chalk.red`Go to: https://nodejs.org/en/download\n`
  );
}

// Setup before requiring `debug`.
if (boolish('EXPO_DEBUG', false)) {
  Debug.enable('expo:*');
} else if (Debug.enabled('expo:')) {
  process.env.EXPO_DEBUG = '1';
}

const packageJson = () => require('../package.json');

async function run() {
  const args = process.argv.slice(2);

  let showVerboseTestResults = false;

  if (args.some((arg) => ['-v', '--version'].includes(arg))) {
    logVersionAndExit();
  }

  if (args.some((arg) => ['-h', '--help'].includes(arg))) {
    logHelpAndExit();
  }

  if (args.some((arg) => ['--verbose'].includes(arg))) {
    showVerboseTestResults = true;
  }

  // TODO: add offline flag

  const projectRootArg = args[0] === '--verbose' ? undefined : args[0];

  const projectRoot = path.resolve(process.cwd(), projectRootArg ?? process.cwd());

  await fs.access(projectRoot, constants.F_OK).catch((err: any) => {
    if (err) {
      console.error(chalk.red(`Project directory ${projectRoot} does not exist`));
      process.exit(1);
    }
  });

  if (showVerboseTestResults) {
    console.log(`expo-doctor: v${packageJson().version}`);
  }
  await actionAsync(projectRoot, showVerboseTestResults);
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
    -v, --version    output the version number
    --verbose        print all test results, including passing ones`);
  process.exit(0);
}

run();
