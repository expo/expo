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
exports.resolveRuntimeVersion = void 0;
const chalk_1 = __importDefault(require("chalk"));
const args_1 = require("./utils/args");
const errors_1 = require("./utils/errors");
const Log = __importStar(require("./utils/log"));
const withConsoleDisabledAsync_1 = require("./utils/withConsoleDisabledAsync");
const resolveRuntimeVersion = async (argv) => {
    const args = (0, args_1.assertArgs)({
        // Types
        '--help': Boolean,
        '--platform': String,
        '--workflow': String,
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
  --workflow <string>                  Workflow to use for runtime version resolution, and auto-detected if not provided
  --debug                              Whether to include verbose debug information in output
  -h, --help                           Output usage information
    `, 0);
    }
    const { resolveRuntimeVersionAsync } = await import('../../utils/build/resolveRuntimeVersionAsync.js');
    const platform = (0, args_1.requireArg)(args, '--platform');
    if (!['ios', 'android'].includes(platform)) {
        throw new errors_1.CommandError(`Invalid platform argument: ${platform}`);
    }
    const workflow = args['--workflow'];
    if (workflow && !['generic', 'managed'].includes(workflow)) {
        throw new errors_1.CommandError(`Invalid workflow argument: ${workflow}. Must be either 'managed' or 'generic'`);
    }
    const debug = args['--debug'];
    const runtimeVersionInfo = await (0, withConsoleDisabledAsync_1.withConsoleDisabledAsync)(async () => {
        try {
            return await resolveRuntimeVersionAsync((0, args_1.getProjectRoot)(args), platform, {
                silent: true,
                debug,
            }, {
                workflowOverride: workflow,
            });
        }
        catch (e) {
            throw new errors_1.CommandError(e.message);
        }
    });
    console.log(JSON.stringify(runtimeVersionInfo));
};
exports.resolveRuntimeVersion = resolveRuntimeVersion;
