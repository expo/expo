#!/usr/bin/env node
'use strict';

const commander = require('commander');
const process = require('process');

commander
  // Common scripts
  .command('configure', `Generate common configuration files`)
  .command('readme', `Generate README`)
  .command(
    'typecheck',
    `Type check the source TypeScript without emitting JS and watch for file changes`
  )
  .command('build', `Compile the source JS or TypeScript and watch for file changes`)
  .command('lint', `Lint the files for syntax errors, style guidance, and common warnings`)
  .command('test', `Run unit tests with an interactive watcher`)
  .command('clean', `Removes compiled files`)

  // Lifecycle scripts
  .command('prepare', `Scripts to run during the "prepare" phase`)
  .command('prepublishOnly', `Scripts to run during the "prepublishOnly" phase`)

  // Pass-through scripts
  .command('babel', `Runs Babel CLI with the given arguments`)
  .command('eslint', `Runs ESLint with the given arguments`)
  .command('jest', `Runs Jest with the given arguments`)
  .command('tsc', `Runs tsc with the given arguments`)

  .parse(process.argv);
