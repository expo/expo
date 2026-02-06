#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const program = new commander_1.Command();
// Main program
program.name('expo-brownfield').version('0.0.1', '-v, --version');
// build:android command
program
    .command('build:android')
    .description('Build and publish Android brownfield artifacts')
    // Build variants
    .option('-d, --debug', 'build debug variant')
    .option('-r, --release', 'build release variant')
    .option('-a, --all', 'build both debug and release variants')
    // Output
    .option('-v, --verbose', 'forward all output to the terminal')
    // Project configuration
    .option('-l, --library <library>', 'name of the brownfield library')
    // Build configuration
    .option('-t, --task <task>', 'publishing task to be run (multiple can be passed)')
    .option('--repo, --repository <repository>', 'repository to publish to (multiple can be passed)');
// build:ios command
program
    .command('build:ios')
    .description('Build and publish iOS brownfield artifacts')
    // Build variants
    .option('-d, --debug', 'build debug configuration')
    .option('-r, --release', 'build release configuration')
    // Output
    .option('-v, --verbose', 'forward all output to the terminal')
    // Project configuration
    .option('-s, --scheme <scheme>', 'name of the iOS scheme')
    .option('-x, --xcworkspace <xcworkspace>', 'path to the Xcode workspace (.xcworkspace)')
    // Build configuration
    .option('-a, --artifacts', 'path to the artifacts directory');
// tasks:android command
program
    .command('tasks:android')
    .description('List available tasks for Android brownfield')
    // Output
    .option('-v, --verbose', 'forward all output to the terminal')
    // Project configuration
    .option('-l, --library <library>', 'name of the brownfield library');
program.parse();
console.log(program.opts());
console.log(program.commands);
console.log(program.args);
