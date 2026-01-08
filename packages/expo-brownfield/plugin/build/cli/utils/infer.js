"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferScheme = exports.inferXCWorkspace = exports.inferAndroidLibrary = void 0;
const promises_1 = __importDefault(require("node:fs/promises"));
const constants_1 = require("../constants");
const node_path_1 = __importDefault(require("node:path"));
const inferAndroidLibrary = async () => {
    const files = ['ReactNativeFragment.kt', 'ReactNativeHostManager.kt'];
    try {
        const android = await promises_1.default.readdir('android', { withFileTypes: true });
        const directories = android.filter((item) => item.isDirectory());
        for (const directory of directories) {
            const contents = await promises_1.default.readdir(`android/${directory.name}`, {
                recursive: true,
            });
            const hasAllFiles = files.every((file) => contents.find((item) => item.includes(file)));
            if (hasAllFiles) {
                return directory.name;
            }
        }
        throw new Error();
    }
    catch (error) {
        return constants_1.Errors.inference('Android library name');
    }
};
exports.inferAndroidLibrary = inferAndroidLibrary;
const inferXCWorkspace = async () => {
    try {
        const xcworkspace = (await promises_1.default.readdir('ios', { withFileTypes: true })).find((item) => item.name.endsWith('.xcworkspace'));
        if (xcworkspace) {
            return node_path_1.default.join(xcworkspace.parentPath, xcworkspace.name);
        }
        throw new Error();
    }
    catch (error) {
        return constants_1.Errors.inference('iOS Workspace (.xcworkspace)');
    }
};
exports.inferXCWorkspace = inferXCWorkspace;
const inferScheme = async () => {
    try {
        const subDirs = (await promises_1.default.readdir('ios', { withFileTypes: true })).filter((item) => item.isDirectory());
        let scheme = undefined;
        for (const subDir of subDirs) {
            // TODO: Rename this file to RNHostManager?
            if ((await promises_1.default.readdir(`ios/${subDir.name}`)).includes('ReactNativeHostManager.swift')) {
                scheme = subDir.name;
            }
        }
        if (scheme) {
            return scheme;
        }
        throw new Error();
    }
    catch (error) {
        return constants_1.Errors.inference('iOS Scheme');
    }
};
exports.inferScheme = inferScheme;
