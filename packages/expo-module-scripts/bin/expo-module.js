#!/usr/bin/env node

import { program } from 'commander';

// Common scripts
program.command('configure', `Generate common configuration files`);
program.command('readme', `Generate README`);
program.command(
  'typecheck',
  `Type check the source TypeScript without emitting JS and watch for file changes`
);
program.command('build', `Compile the source JS or TypeScript and watch for file changes`);
program.command('build-src', `Transpile source with oxc-transform and emit declarations with tsc`);
program.command('depscheck', `Check that source imports resolve to declared dependencies`);
program.command('test', `Run unit tests with an interactive watcher`);
program.command('clean', `Removes compiled files`);

// Lifecycle scripts
program.command('prepare', `Scripts to run during the "prepare" phase`);
program.command('prepublishOnly', `Scripts to run during the "prepublishOnly" phase`);

// Pass-through scripts
program.command('jest', `Runs Jest with the given arguments`);
program.command('tsc', `Runs tsc with the given arguments`);

program.parse(process.argv);
