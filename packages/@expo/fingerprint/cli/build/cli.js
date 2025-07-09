#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const arg_1 = __importDefault(require("arg"));
const chalk_1 = __importDefault(require("chalk"));
const debug_1 = __importDefault(require("debug"));
const getenv_1 = require("getenv");
const runLegacyCLIAsync_1 = require("./runLegacyCLIAsync");
const errors_1 = require("./utils/errors");
const Log = __importStar(require("./utils/log"));
// Setup before requiring `debug`.
if ((0, getenv_1.boolish)('EXPO_DEBUG', false)) {
    debug_1.default.enable('@expo/fingerprint:*');
}
else if (debug_1.default.enabled('@expo/fingerprint:')) {
    process.env.EXPO_DEBUG = '1';
}
const commands = {
    // Add a new command here
    'fingerprint:generate': () => import('./commands/generateFingerprint.js').then((i) => i.generateFingerprintAsync),
    'fingerprint:diff': () => import('./commands/diffFingerprints.js').then((i) => i.diffFingerprintsAsync),
};
const args = (0, arg_1.default)({
    // Types
    '--version': Boolean,
    '--help': Boolean,
    // Aliases
    '-h': '--help',
}, {
    permissive: true,
});
if (args['--version']) {
    // Version is added in the build script.
    const packageJSON = require('../../package.json');
    console.log(packageJSON.version);
    process.exit(0);
}
const command = args._[0];
const commandArgs = args._.slice(1);
// Handle `--help` flag
if ((args['--help'] && !command) || !command) {
    Log.exit((0, chalk_1.default) `
{bold Usage}
  {dim $} npx @expo/fingerprint <command>

{bold Commands}
  ${Object.keys(commands).sort().join(', ')}

{bold Options}
  --help, -h      Displays this message

For more information run a command with the --help flag
  {dim $} npx @expo/fingerprint fingerprint:generate --help
  `, 0);
}
// Push the help flag to the subcommand args.
if (args['--help']) {
    commandArgs.push('--help');
}
// Install exit hooks
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
if (!(command in commands)) {
    (0, runLegacyCLIAsync_1.runLegacyCLIAsync)(args._).catch(errors_1.logCmdError);
}
else {
    commands[command]()
        .then((exec) => exec(commandArgs))
        .catch(errors_1.logCmdError);
}
