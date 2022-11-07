"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchBrowserAsync = void 0;
const os_1 = __importDefault(require("os"));
const LaunchBrowser_types_1 = require("./LaunchBrowser.types");
const LaunchBrowserImplLinux_1 = __importDefault(require("./LaunchBrowserImplLinux"));
const LaunchBrowserImplMacOS_1 = __importDefault(require("./LaunchBrowserImplMacOS"));
const LaunchBrowserImplWindows_1 = __importDefault(require("./LaunchBrowserImplWindows"));
const IS_WSL = require('is-wsl') && !require('is-docker')();
/**
 * Launch a browser for JavaScript inspector
 */
async function launchBrowserAsync(url) {
    const browser = createBrowser();
    const tempBrowserDir = await browser.createTempBrowserDir('expo-inspector');
    // For dev-client connecting metro in LAN, the request to fetch sourcemaps may be blocked by Chromium
    // with insecure-content (https page send xhr for http resource).
    // Adding `--allow-running-insecure-content` to overcome this limitation
    // without users manually allow insecure-content in site settings.
    // However, if there is existing chromium browser process, the argument will not take effect.
    // We also pass a `--user-data-dir=` as temporary profile and force chromium to create new browser process.
    const launchArgs = [
        `--app=${url}`,
        '--allow-running-insecure-content',
        `--user-data-dir=${tempBrowserDir}`,
        '--no-first-run',
        '--no-default-browser-check',
    ];
    for (const browserType of [LaunchBrowser_types_1.LaunchBrowserTypes.CHROME, LaunchBrowser_types_1.LaunchBrowserTypes.EDGE]) {
        const isSupported = await browser.isSupportedBrowser(browserType);
        if (isSupported) {
            return browser.launchAsync(browserType, launchArgs);
        }
    }
    throw new Error('[LaunchBrowser] Unable to find a browser on the host to open the inspector. Supported browsers: Google Chrome, Microsoft Edge');
}
exports.launchBrowserAsync = launchBrowserAsync;
function createBrowser() {
    if (os_1.default.platform() === 'darwin') {
        return new LaunchBrowserImplMacOS_1.default();
    }
    if (os_1.default.platform() === 'win32' || IS_WSL) {
        return new LaunchBrowserImplWindows_1.default();
    }
    if (os_1.default.platform() === 'linux') {
        return new LaunchBrowserImplLinux_1.default();
    }
    throw new Error('[LaunchBrowser] Unsupported host platform');
}
