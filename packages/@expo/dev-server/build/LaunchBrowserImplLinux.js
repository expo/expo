"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const open_1 = __importDefault(require("open"));
const path_1 = __importDefault(require("path"));
const LaunchBrowser_types_1 = require("./LaunchBrowser.types");
/**
 * Browser implementation for Linux
 */
class LaunchBrowserImplLinux {
    constructor() {
        this.MAP = {
            [LaunchBrowser_types_1.LaunchBrowserTypes.CHROME]: ['google-chrome', 'google-chrome-stable', 'chromium'],
            [LaunchBrowser_types_1.LaunchBrowserTypes.EDGE]: ['microsoft-edge', 'microsoft-edge-dev'],
        };
    }
    /**
     * On Linux, the supported appId is an array, this function finds the available appId and caches it
     */
    async getAppId(browserType) {
        if (this._appId == null || !this.MAP[browserType].includes(this._appId)) {
            for (const appId of this.MAP[browserType]) {
                try {
                    const { status } = await (0, spawn_async_1.default)('which', [appId], { stdio: 'ignore' });
                    if (status === 0) {
                        this._appId = appId;
                        break;
                    }
                }
                catch { }
            }
        }
        if (this._appId == null) {
            throw new Error(`Unable to find supported browser - tried[${this.MAP[browserType].join(', ')}]`);
        }
        return this._appId;
    }
    async isSupportedBrowser(browserType) {
        let result = false;
        try {
            await this.getAppId(browserType);
            result = true;
        }
        catch {
            result = false;
        }
        return result;
    }
    async createTempBrowserDir(baseDirName) {
        return path_1.default.join(require('temp-dir'), baseDirName);
    }
    async launchAsync(browserType, args) {
        const appId = await this.getAppId(browserType);
        this._process = await open_1.default.openApp(appId, { arguments: args });
        return this;
    }
    async close() {
        this._process?.kill();
        this._process = undefined;
        this._appId = undefined;
    }
}
exports.default = LaunchBrowserImplLinux;
