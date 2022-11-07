"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const open_1 = __importDefault(require("open"));
const path_1 = __importDefault(require("path"));
const LaunchBrowser_types_1 = require("./LaunchBrowser.types");
const IS_WSL = require('is-wsl') && !require('is-docker')();
/**
 * Browser implementation for Windows and WSL
 *
 * To minimize the difference between Windows and WSL, the implementation wraps all spawn calls through powershell.
 */
class LaunchBrowserImplWindows {
    constructor() {
        this.MAP = {
            [LaunchBrowser_types_1.LaunchBrowserTypes.CHROME]: {
                appId: 'chrome',
                fullName: 'Google Chrome',
            },
            [LaunchBrowser_types_1.LaunchBrowserTypes.EDGE]: {
                appId: 'msedge',
                fullName: 'Microsoft Edge',
            },
        };
    }
    async isSupportedBrowser(browserType) {
        let result = false;
        try {
            const { status } = await (0, spawn_async_1.default)('powershell.exe', ['-c', `Get-Package -Name '${this.MAP[browserType].fullName}'`], { stdio: 'ignore' });
            result = status === 0;
        }
        catch {
            result = false;
        }
        return result;
    }
    async createTempBrowserDir(baseDirName) {
        let tmpDir;
        if (IS_WSL) {
            // On WSL, the browser is actually launched in host, the `temp-dir` returns the linux /tmp path where host browsers cannot reach into.
            // We should get the temp path through the `$TEMP` windows environment variable.
            tmpDir = (await (0, spawn_async_1.default)('powershell.exe', ['-c', 'echo "$Env:TEMP"'])).stdout.trim();
            return `${tmpDir}\\${baseDirName}`;
        }
        else {
            tmpDir = require('temp-dir');
            return path_1.default.join(tmpDir, baseDirName);
        }
    }
    async launchAsync(browserType, args) {
        const appId = this.MAP[browserType].appId;
        await open_1.default.openApp(appId, { arguments: args });
        this._appId = appId;
        return this;
    }
    async close() {
        if (this._appId != null) {
            try {
                // Since we wrap all spawn calls through powershell as well as from `open.openApp`, the returned ChildProcess is not the browser process.
                // And we cannot just call `process.kill()` kill it.
                // The implementation tries to find the pid of target chromium browser process (with --app=https://chrome-devtools-frontend.appspot.com in command arguments),
                // and uses taskkill to terminate the process.
                await (0, spawn_async_1.default)('powershell.exe', [
                    '-c',
                    `taskkill.exe /pid @(Get-WmiObject Win32_Process -Filter "name = '${this._appId}.exe' AND CommandLine LIKE '%chrome-devtools-frontend.appspot.com%'" | Select-Object -ExpandProperty ProcessId)`,
                ], { stdio: 'ignore' });
            }
            catch { }
            this._appId = undefined;
        }
    }
}
exports.default = LaunchBrowserImplWindows;
