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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveRuntimeVersion = void 0;
const chalk_1 = __importDefault(require("chalk"));
const args_1 = require("./utils/args");
const Log = __importStar(require("./utils/log"));
const resolveRuntimeVersion = async (argv) => {
    const args = (0, args_1.assertArgs)({
        // Types
        '--help': Boolean,
        '--platform': String,
        '--debug': Boolean,
        // Aliases
        '-h': '--help',
    }, argv ?? []);
    if (args['--help']) {
        Log.exit((0, chalk_1.default) `
{bold Description}
Resolve expo-updates runtime version

{bold Usage}
  {dim $} npx expo-updates runtimeversion:resolve --platform <platform>

  Options
  --platform <string>                  Platform to resolve runtime version for
  --debug                              Whether to include verbose debug information in output
  -h, --help                           Output usage information
    `, 0);
    }
    const { resolveRuntimeVersionAsync } = await import('../../utils/build/resolveRuntimeVersionAsync.js');
    const platform = (0, args_1.requireArg)(args, '--platform');
    if (!['ios', 'android'].includes(platform)) {
        throw new Error(`Invalid platform argument: ${platform}`);
    }
    const debug = args['--debug'];
    const runtimeVersionInfo = await resolveRuntimeVersionAsync((0, args_1.getProjectRoot)(args), platform, {
        silent: true,
        debug,
    });
    console.log(JSON.stringify(runtimeVersionInfo));
};
exports.resolveRuntimeVersion = resolveRuntimeVersion;
