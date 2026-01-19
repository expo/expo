"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferScheme = exports.inferXCWorkspace = exports.inferAndroidLibrary = void 0;
const promises_1 = __importDefault(require("node:fs/promises"));
const path_1 = __importDefault(require("path"));
const constants_1 = require("../constants");
const inferAndroidLibrary = async () => {
    const files = ['ReactNativeFragment.kt', 'ReactNativeHostManager.kt'];
    try {
        const androidPath = path_1.default.join(process.cwd(), 'android');
        await promises_1.default.access(androidPath);
        const android = await promises_1.default.readdir(androidPath, { withFileTypes: true });
        const directories = android.filter((item) => item.isDirectory());
        if (directories.length === 0) {
            throw new Error('No directories found in android/ folder');
        }
        for (const directory of directories) {
            const libraryPath = path_1.default.join(androidPath, directory.name);
            try {
                const contents = await promises_1.default.readdir(libraryPath, {
                    recursive: true,
                });
                const hasAllFiles = files.every((file) => contents.some((item) => item.includes(file)));
                if (hasAllFiles) {
                    return directory.name;
                }
            }
            catch (readError) {
                continue;
            }
        }
        throw new Error('');
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return constants_1.Errors.inference('Android library name: ' + message);
    }
};
exports.inferAndroidLibrary = inferAndroidLibrary;
const inferXCWorkspace = async () => {
    try {
        const iosPath = path_1.default.join(process.cwd(), 'ios');
        const xcworkspace = (await promises_1.default.readdir(iosPath, { withFileTypes: true })).find((item) => item.name.endsWith('.xcworkspace'));
        if (xcworkspace) {
            return path_1.default.join(xcworkspace.parentPath, xcworkspace.name);
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
        const iosPath = path_1.default.join(process.cwd(), 'ios');
        const subDirs = (await promises_1.default.readdir(iosPath, { withFileTypes: true })).filter((item) => item.isDirectory());
        let scheme = undefined;
        for (const subDir of subDirs) {
            if ((await promises_1.default.readdir(`${iosPath}/${subDir.name}`)).includes('ReactNativeHostManager.swift')) {
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
