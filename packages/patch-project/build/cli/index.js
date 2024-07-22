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
const arg_1 = __importDefault(require("arg"));
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const logger = __importStar(require("./logger"));
const patchProjectAsync_1 = require("./patchProjectAsync");
(async () => {
    const args = (0, arg_1.default)({
        // Types
        '--help': Boolean,
        '--clean': Boolean,
        '--template': String,
        '--platform': String,
        // Aliases
        '-h': '--help',
        '-p': '--platform',
    });
    if (args['--help']) {
        printHelp(`(Experimental) Generate patch files for iOS and Android native projects to persist changes made manually after prebuild`, (0, chalk_1.default) `npx patch-project {dim <dir>}`, [
            (0, chalk_1.default) `<dir>                                    Directory of the Expo project. {dim Default: Current working directory}`,
            `--clean                                  Delete the native folders after the conversion`,
            `--template <template>                    Project template to clone from. File path pointing to a local tar file or a github repo`,
            (0, chalk_1.default) `-p, --platform <all|android|ios>         Platforms to sync: ios, android, all. {dim Default: all}`,
            `-h, --help                               Usage info`,
        ].join('\n'));
    }
    const projectRoot = path_1.default.resolve(args._[0] || '.');
    if (!(0, fs_1.existsSync)(projectRoot)) {
        logger.exit(`Invalid project root: ${projectRoot}`);
    }
    try {
        await (0, patchProjectAsync_1.patchProjectAsync)(projectRoot, {
            // Parsed options
            clean: !!args['--clean'],
            platforms: resolvePlatformOption(args['--platform']),
            template: args['--template'],
        });
    }
    catch (e) {
        if (e instanceof Error || typeof e === 'string') {
            logger.exit(e);
        }
        throw e;
    }
})();
// Install exit hooks
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
function printHelp(info, usage, options, extra = '') {
    logger.exit((0, chalk_1.default) `
  {bold Info}
    ${info}

  {bold Usage}
    {dim $} ${usage}

  {bold Options}
    ${options.split('\n').join('\n    ')}
` + extra, 0);
}
function resolvePlatformOption(platform = 'all', { loose } = {}) {
    switch (platform) {
        case 'ios':
            return ['ios'];
        case 'android':
            return ['android'];
        case 'all':
            return loose || process.platform !== 'win32' ? ['android', 'ios'] : ['android'];
        default:
            return [platform];
    }
}
//# sourceMappingURL=index.js.map