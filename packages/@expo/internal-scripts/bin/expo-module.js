#!/usr/bin/env node

import { program } from 'commander';

// Common scripts
program.command('configure', `Generate common configuration files`);
program.command('readme', `Generate README`);
program.command('depscheck', `Check that source imports resolve to declared dependencies`);
program.command('format', `Format source files`);
program.command('clean', `Removes compiled files`);

// Lifecycle scripts
program.command('prepack', `Scripts to run during the "prepack" phase`);
program.command('prepublishOnly', `Scripts to run during the "prepublishOnly" phase`);

program.parse(process.argv);
