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
Object.defineProperty(exports, "__esModule", { value: true });
const osascript = __importStar(require("@expo/osascript"));
const child_process_1 = require("child_process");
const glob_1 = require("glob");
const LaunchBrowser_types_1 = require("./LaunchBrowser.types");
/**
 * Browser implementation for macOS
 */
class LaunchBrowserImplMacOS {
    constructor() {
        this.MAP = {
            [LaunchBrowser_types_1.LaunchBrowserTypes.CHROME]: 'google chrome',
            [LaunchBrowser_types_1.LaunchBrowserTypes.EDGE]: 'microsoft edge',
        };
    }
    async isSupportedBrowser(browserType) {
        let result = false;
        try {
            await osascript.execAsync(`id of application "${this.MAP[browserType]}"`);
            result = true;
        }
        catch {
            result = false;
        }
        return result;
    }
    async launchAsync(browserType, args) {
        const appDirectory = await osascript.execAsync(`POSIX path of (path to application "${this.MAP[browserType]}")`);
        const appPath = (0, glob_1.sync)('Contents/MacOS/*', { cwd: appDirectory.trim(), absolute: true })?.[0];
        if (!appPath) {
            throw new Error(`Cannot find application path from ${appDirectory}Contents/MacOS`);
        }
        this._process = (0, child_process_1.spawn)(appPath, args, { stdio: 'ignore' });
        return this;
    }
    async close() {
        this._process?.kill();
        this._process = undefined;
    }
}
exports.default = LaunchBrowserImplMacOS;
