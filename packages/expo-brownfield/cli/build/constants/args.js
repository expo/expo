"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Args = void 0;
const arg_1 = __importDefault(require("arg"));
/**
 * General CLI arguments
 */
const generalArgs = {
    // Types
    '--help': arg_1.default.COUNT,
    '--version': arg_1.default.COUNT,
    // Aliases
    '-h': '--help',
    '-v': '--version',
};
/**
 * Common build arguments shared by Android and iOS
 */
const buildCommonArgs = {
    // Types
    '--debug': arg_1.default.COUNT,
    '--help': arg_1.default.COUNT,
    '--release': arg_1.default.COUNT,
    '--verbose': arg_1.default.COUNT,
    // Aliases
    '-d': '--debug',
    '-h': '--help',
    '-r': '--release',
};
/**
 * Android build arguments
 */
const buildAndroidArgs = {
    // Inherited
    ...buildCommonArgs,
    // Types
    '--all': arg_1.default.COUNT,
    '--library': String,
    '--repository': [String],
    '--task': [String],
    // Aliases
    '-a': '--all',
    '-l': '--library',
    '--repo': '--repository',
    '-t': '--task',
};
/**
 * Android tasks arguments
 */
const tasksAndroidArgs = {
    // Types
    '--help': arg_1.default.COUNT,
    '--library': String,
    '--verbose': arg_1.default.COUNT,
    // Aliases
    '-h': '--help',
    '-l': '--library',
};
/**
 * iOS build arguments
 */
const buildIosArgs = {
    // Inherited
    ...buildCommonArgs,
    // Types
    '--artifacts': String,
    '--scheme': String,
    '--xcworkspace': String,
    // Aliases
    '-a': '--artifacts',
    '-s': '--scheme',
    '-x': '--xcworkspace',
};
/**
 * CLI arguments
 */
exports.Args = {
    Android: buildAndroidArgs,
    General: generalArgs,
    IOS: buildIosArgs,
    TasksAndroid: tasksAndroidArgs,
};
