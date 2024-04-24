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
exports.generateFingerprint = void 0;
const chalk_1 = __importDefault(require("chalk"));
const args_1 = require("./utils/args");
const errors_1 = require("./utils/errors");
const Log = __importStar(require("./utils/log"));
const generateFingerprint = async (argv) => {
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
Generate fingerprint for use in expo-updates runtime version

{bold Usage}
  {dim $} npx expo-updates fingerprint:generate --platform <platform>

  Options
  --platform <string>                  Platform to generate a fingerprint for
  --workflow <string>                  Workflow to use for fingerprint generation, and auto-detected if not provided
  --debug                              Whether to include verbose debug information in output
  -h, --help                           Output usage information
    `, 0);
    }
    const [{ createFingerprintAsync }, { resolveWorkflowAsync }] = await Promise.all([
        import('../../utils/build/createFingerprintAsync.js'),
        import('../../utils/build/workflow.js'),
    ]);
    const platform = (0, args_1.requireArg)(args, '--platform');
    if (!['ios', 'android'].includes(platform)) {
        throw new errors_1.CommandError(`Invalid platform argument: ${platform}`);
    }
    const workflowArg = args['--workflow'];
    if (workflowArg && !['generic', 'managed'].includes(workflowArg)) {
        throw new errors_1.CommandError(`Invalid workflow argument: ${workflowArg}. Must be either 'managed' or 'generic'`);
    }
    const debug = args['--debug'];
    const projectRoot = (0, args_1.getProjectRoot)(args);
    let result;
    try {
        const workflow = workflowArg ?? (await resolveWorkflowAsync(projectRoot, platform));
        result = await createFingerprintAsync(projectRoot, platform, workflow, { silent: true, debug });
    }
    catch (e) {
        throw new errors_1.CommandError(e.message);
    }
    console.log(JSON.stringify(result));
};
exports.generateFingerprint = generateFingerprint;
