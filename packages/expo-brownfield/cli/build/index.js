#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const commands_1 = require("./commands");
const package_json_1 = __importDefault(require("../../package.json"));
const program = new commander_1.Command();
// main program
program.name('expo-brownfield').version(package_json_1.default.version, '-v, --version');
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
    .option('--repo, --repository <repository...>', 'repository to publish to (multiple can be passed)')
    .option('--dry-run', 'only print the commands without executing them')
    .action(async function () {
    await (0, commands_1.buildAndroid)(this);
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
    .option('--dry-run', 'only print the commands without executing them')
    .action(async function () {
    await (0, commands_1.buildIos)(this);
});
// tasks:android
program
    .command('tasks:android')
    .description('List available publishing tasks and repositories for Android')
    .option('--verbose', 'forward all output to the terminal')
    .option('-l, --library <library>', 'name of the brownfield library')
    .option('--dry-run', 'only print the commands without executing them')
    .action(async function () {
    await (0, commands_1.tasksAndroid)(this);
});
program.parse();
