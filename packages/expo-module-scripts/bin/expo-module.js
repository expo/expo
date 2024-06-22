#!/usr/bin/env node
'use strict';

const { program } = require('commander');
const process = require('process');

program.command('configure', `Generate common configuration files`);
program.command('readme', `Generate README`);
program.command(
  'typecheck',
  `Type check the source TypeScript without emitting JS and watch for file changes`
);
program.command('build', `Compile the source JS or TypeScript and watch for file changes`);
program.command('lint', `Lint the files for syntax errors, style guidance, and common warnings`);
program.command('test', `Run unit tests with an interactive watcher`);
program.command('clean', `Removes compiled files`);

// Lifecycle scripts
program.command('prepare', `Scripts to run during the "prepare" phase`);
program.command('prepublishOnly', `Scripts to run during the "prepublishOnly" phase`);

// Pass-through scripts
program.command('babel', `Runs Babel CLI with the given arguments`);
program.command('eslint', `Runs ESLint with the given arguments`);
program.command('jest', `Runs Jest with the given arguments`);
program.command('tsc', `Runs tsc with the given arguments`);

program.parse(process.argv);
