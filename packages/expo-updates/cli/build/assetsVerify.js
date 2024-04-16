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
exports.expoAssetsVerify = void 0;
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const assetsVerifyAsync_1 = require("./assetsVerifyAsync");
const assetsVerifyTypes_1 = require("./assetsVerifyTypes");
const args_1 = require("./utils/args");
const errors_1 = require("./utils/errors");
const Log = __importStar(require("./utils/log"));
const debug = require('debug')('expo-updates:assets:verify');
const expoAssetsVerify = async (argv) => {
    const args = (0, args_1.assertArgs)({
        // Types
        '--asset-map-path': String,
        '--exported-manifest-path': String,
        '--build-manifest-path': String,
        '--platform': String,
        '--help': Boolean,
        // Aliases
        '-a': '--asset-map-path',
        '-e': '--exported-manifest-path',
        '-b': '--build-manifest-path',
        '-p': '--platform',
        '-h': '--help',
    }, argv ?? []);
    if (args['--help']) {
        Log.exit((0, chalk_1.default) `
{bold Description}
Verify that all static files in an exported bundle are in either the export or an embedded bundle

{bold Usage}
  {dim $} npx expo-updates assets:verify {dim <dir>}

  Options
  <dir>                                  Directory of the Expo project. Default: Current working directory
  -a, --asset-map-path <path>            Path to the \`assetmap.json\` in an export produced by the command \`npx expo export --dump-assetmap\`
  -e, --exported-manifest-path <path>    Path to the \`metadata.json\` in an export produced by the command \`npx expo export --dump-assetmap\`
  -b, --build-manifest-path <path>       Path to the \`app.manifest\` file created by expo-updates in an Expo application build (either ios or android)
  -p, --platform <platform>              Options: ${JSON.stringify(assetsVerifyTypes_1.validPlatforms)}
  -h, --help                             Usage info
  `, 0);
    }
    const projectRoot = (0, args_1.getProjectRoot)(args);
    const validatedArgs = resolveOptions(projectRoot, args);
    debug(`Validated params: ${JSON.stringify(validatedArgs, null, 2)}`);
    const { buildManifestPath, exportedManifestPath, assetMapPath, platform } = validatedArgs;
    const missingAssets = await (0, assetsVerifyAsync_1.getMissingAssetsAsync)(buildManifestPath, exportedManifestPath, assetMapPath, platform);
    if (missingAssets.length > 0) {
        throw new errors_1.CommandError(`${missingAssets.length} assets not found in either embedded manifest or in exported bundle:${JSON.stringify(missingAssets, null, 2)}`);
    }
    else {
        Log.log(`All resolved assets found in either embedded manifest or in exported bundle.`);
    }
};
exports.expoAssetsVerify = expoAssetsVerify;
function resolveOptions(projectRoot, args) {
    const exportedManifestPath = validatedPathFromArgument(projectRoot, args, '--exported-manifest-path');
    const buildManifestPath = validatedPathFromArgument(projectRoot, args, '--build-manifest-path');
    const assetMapPath = validatedPathFromArgument(projectRoot, args, '--asset-map-path');
    const platform = args['--platform'];
    if (!(0, assetsVerifyTypes_1.isValidPlatform)(platform)) {
        throw new errors_1.CommandError(`Platform must be one of ${JSON.stringify(assetsVerifyTypes_1.validPlatforms)}`);
    }
    return {
        exportedManifestPath,
        buildManifestPath,
        assetMapPath,
        platform,
    };
}
function validatedPathFromArgument(projectRoot, args, key) {
    const maybeRelativePath = args[key];
    if (!maybeRelativePath) {
        throw new errors_1.CommandError(`No value for ${key}`);
    }
    if (maybeRelativePath.indexOf('/') === 0) {
        return maybeRelativePath; // absolute path
    }
    return path_1.default.resolve(projectRoot, maybeRelativePath);
}
