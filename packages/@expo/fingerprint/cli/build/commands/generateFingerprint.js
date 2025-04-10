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
exports.generateFingerprintAsync = void 0;
const chalk_1 = __importDefault(require("chalk"));
const getenv_1 = require("getenv");
const index_1 = require("../../../build/index");
const args_1 = require("../utils/args");
const errors_1 = require("../utils/errors");
const Log = __importStar(require("../utils/log"));
const withConsoleDisabledAsync_1 = require("../utils/withConsoleDisabledAsync");
const generateFingerprintAsync = async (argv) => {
    const args = (0, args_1.assertArgs)({
        // Types
        '--help': Boolean,
        '--platform': [String],
        '--concurrent-io-limit': Number,
        '--hash-algorithm': String,
        '--ignore-path': [String],
        '--source-skips': Number,
        '--debug': Boolean,
        // Aliases
        '-h': '--help',
    }, argv ?? []);
    if (args['--help']) {
        Log.exit((0, chalk_1.default) `
{bold Description}
Generate fingerprint for a project

{bold Usage}
  {dim $} npx @expo/fingerprint fingerprint:generate

  Options
  --platform <string[]>                Limit native files to those for specified platforms. Default is ['android', 'ios'].
  --concurrent-io-limit <number>       I/O concurrent limit. Default is the number of CPU cores.
  --hash-algorithm <string>            The algorithm to use for crypto.createHash(). Default is 'sha1'.
  --ignore-path <string[]>             Ignore files and directories from hashing. The supported pattern is the same as glob().
  --source-skips <number>              Skips some sources from fingerprint. Value is the result of bitwise-OR'ing desired values of SourceSkips. Default is DEFAULT_SOURCE_SKIPS.
  --debug                              Whether to include verbose debug information in output
  -h, --help                           Output usage information
    `, 0);
    }
    const platforms = args['--platform'];
    if (platforms) {
        if (!Array.isArray(platforms)) {
            throw new errors_1.CommandError(`Invalid value for --platform`);
        }
        if (!platforms.every((elem) => ['ios', 'android'].includes(elem))) {
            throw new errors_1.CommandError(`Invalid value for --platform: ${platforms}`);
        }
    }
    const concurrentIoLimit = args['--concurrent-io-limit'];
    if (concurrentIoLimit && !Number.isInteger(concurrentIoLimit)) {
        throw new errors_1.CommandError(`Invalid value for --concurrent-io-limit argument: ${concurrentIoLimit}`);
    }
    const hashAlgorithm = args['--hash-algorithm'];
    if (hashAlgorithm && typeof hashAlgorithm !== 'string') {
        throw new errors_1.CommandError(`Invalid value for --hash-algorithm: ${hashAlgorithm}`);
    }
    const ignorePaths = args['--ignore-path'];
    if (ignorePaths) {
        if (!Array.isArray(ignorePaths)) {
            throw new errors_1.CommandError(`Invalid value for --ignore-path`);
        }
        if (!ignorePaths.every((elem) => typeof elem === 'string')) {
            throw new errors_1.CommandError(`Invalid value for --ignore-path: ${ignorePaths}`);
        }
    }
    const sourceSkips = args['--source-skips'];
    if (sourceSkips && !Number.isInteger(sourceSkips)) {
        throw new errors_1.CommandError(`Invalid value for --source-skips argument: ${sourceSkips}`);
    }
    const options = {
        debug: !!process.env.DEBUG || args['--debug'],
        silent: true,
        useRNCoreAutolinkingFromExpo: process.env['USE_RNCORE_AUTOLINKING_FROM_EXPO']
            ? (0, getenv_1.boolish)('USE_RNCORE_AUTOLINKING_FROM_EXPO')
            : undefined,
        ...(platforms ? { platforms } : null),
        ...(concurrentIoLimit ? { concurrentIoLimit } : null),
        ...(hashAlgorithm ? { hashAlgorithm } : null),
        ...(ignorePaths ? { ignorePaths } : null),
        ...(sourceSkips ? { sourceSkips } : null),
    };
    const projectRoot = (0, args_1.getProjectRoot)(args);
    const result = await (0, withConsoleDisabledAsync_1.withConsoleDisabledAsync)(async () => {
        try {
            return await (0, index_1.createFingerprintAsync)(projectRoot, options);
        }
        catch (e) {
            throw new errors_1.CommandError(e.message);
        }
    });
    console.log(JSON.stringify(result));
};
exports.generateFingerprintAsync = generateFingerprintAsync;
