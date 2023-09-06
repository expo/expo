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
exports.getUserState = exports.getUserStatePath = exports.getExpoHomeDirectory = void 0;
const json_file_1 = __importDefault(require("@expo/json-file"));
const getenv_1 = require("getenv");
const os_1 = require("os");
const path = __importStar(require("path"));
// The ~/.expo directory is used to store authentication sessions,
// which are shared between EAS CLI and Expo CLI.
function getExpoHomeDirectory() {
    const home = (0, os_1.homedir)();
    if (process.env.__UNSAFE_EXPO_HOME_DIRECTORY) {
        return process.env.__UNSAFE_EXPO_HOME_DIRECTORY;
    }
    else if ((0, getenv_1.boolish)('EXPO_STAGING', false)) {
        return path.join(home, '.expo-staging');
    }
    else if ((0, getenv_1.boolish)('EXPO_LOCAL', false)) {
        return path.join(home, '.expo-local');
    }
    return path.join(home, '.expo');
}
exports.getExpoHomeDirectory = getExpoHomeDirectory;
function getUserStatePath() {
    return path.join(getExpoHomeDirectory(), 'state.json');
}
exports.getUserStatePath = getUserStatePath;
function getUserState() {
    return new json_file_1.default(getUserStatePath(), {
        jsonParseErrorDefault: {},
        // This will ensure that an error isn't thrown if the file doesn't exist.
        cantReadFileDefault: {},
    });
}
exports.getUserState = getUserState;
