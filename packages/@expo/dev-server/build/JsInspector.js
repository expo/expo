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
exports.queryAllInspectorAppsAsync = exports.queryInspectorAppAsync = exports.closeJsInspector = exports.openJsInspector = void 0;
const osascript = __importStar(require("@expo/osascript"));
const child_process_1 = require("child_process");
const glob_1 = require("glob");
const node_fetch_1 = __importDefault(require("node-fetch"));
const open_1 = __importDefault(require("open"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
let openingChildProcess = null;
function openJsInspector(app) {
    // To update devtoolsFrontendRev, find the full commit hash in the url:
    // https://chromium.googlesource.com/chromium/src.git/+log/refs/tags/{CHROME_VERSION}/chrome/VERSION
    //
    // 1. Replace {CHROME_VERSION} with the target chrome version
    // 2. Click the first log item in the webpage
    // 3. The full commit hash is the desired revision
    const devtoolsFrontendRev = 'e3cd97fc771b893b7fd1879196d1215b622c2bed'; // Chrome 90.0.4430.212
    const urlBase = `https://chrome-devtools-frontend.appspot.com/serve_rev/@${devtoolsFrontendRev}/inspector.html`;
    const ws = app.webSocketDebuggerUrl.replace('ws://[::]:', 'localhost:');
    const url = `${urlBase}?panel=sources&v8only=true&ws=${encodeURIComponent(ws)}`;
    launchChromiumAsync(url);
}
exports.openJsInspector = openJsInspector;
function closeJsInspector() {
    if (openingChildProcess != null) {
        openingChildProcess.kill();
        openingChildProcess = null;
    }
}
exports.closeJsInspector = closeJsInspector;
async function queryInspectorAppAsync(metroServerOrigin, appId) {
    var _a;
    const apps = await queryAllInspectorAppsAsync(metroServerOrigin);
    return (_a = apps.find(app => app.description === appId)) !== null && _a !== void 0 ? _a : null;
}
exports.queryInspectorAppAsync = queryInspectorAppAsync;
async function queryAllInspectorAppsAsync(metroServerOrigin) {
    const resp = await (0, node_fetch_1.default)(`${metroServerOrigin}/json/list`);
    const apps = transformApps(await resp.json());
    // Only use targets with better reloading support
    return apps.filter(app => app.title === 'React Native Experimental (Improved Chrome Reloads)');
}
exports.queryAllInspectorAppsAsync = queryAllInspectorAppsAsync;
// The description of `React Native Experimental (Improved Chrome Reloads)` target is `don't use` from metro.
// This function tries to transform the unmeaningful description to appId
function transformApps(apps) {
    const deviceIdToAppId = {};
    for (const app of apps) {
        if (app.description !== "don't use") {
            const deviceId = app.id.split('-')[0];
            const appId = app.description;
            deviceIdToAppId[deviceId] = appId;
        }
    }
    return apps.map(app => {
        var _a;
        if (app.description === "don't use") {
            const deviceId = app.id.split('-')[0];
            app.description = (_a = deviceIdToAppId[deviceId]) !== null && _a !== void 0 ? _a : app.description;
        }
        return app;
    });
}
async function launchChromiumAsync(url) {
    // For dev-client connecting metro in LAN, the request to fetch sourcemaps may be blocked by Chromium
    // with insecure-content (https page send xhr for http resource).
    // Adding `--allow-running-insecure-content` to overcome this limitation
    // without users manually allow insecure-content in site settings.
    // However, if there is existing chromium browser process, the argument will not take effect.
    // We also pass a `--user-data-dir=` as temporary profile and force chromium to create new browser process.
    const tmpDir = require('temp-dir');
    const tempProfileDir = path_1.default.join(tmpDir, 'expo-inspector');
    const launchArgs = [
        `--app=${url}`,
        '--allow-running-insecure-content',
        `--user-data-dir=${tempProfileDir}`,
        '--no-first-run',
        '--no-startup-window',
        '--no-default-browser-check',
    ];
    const supportedChromiums = [open_1.default.apps.chrome, open_1.default.apps.edge];
    for (const chromium of supportedChromiums) {
        try {
            await launchAppAsync(chromium, launchArgs);
            return;
        }
        catch { }
    }
    throw new Error('Unable to find a browser on the host to open the inspector. Supported browsers: Google Chrome, Microsoft Edge');
}
async function launchAppAsync(appName, launchArgs) {
    var _a;
    if (os_1.default.platform() === 'darwin' && !Array.isArray(appName)) {
        const appDirectory = await osascript.execAsync(`POSIX path of (path to application "${appName}")`);
        const appPath = (_a = (0, glob_1.sync)('Contents/MacOS/*', { cwd: appDirectory.trim(), absolute: true })) === null || _a === void 0 ? void 0 : _a[0];
        if (!appPath) {
            throw new Error(`Cannot find application path from ${appDirectory}Contents/MacOS`);
        }
        closeJsInspector();
        openingChildProcess = (0, child_process_1.spawn)(appPath, launchArgs, { stdio: 'ignore' });
        return;
    }
    const result = await open_1.default.openApp(appName, {
        arguments: launchArgs,
        newInstance: true,
        wait: true,
    });
    if (result.exitCode !== 0) {
        throw new Error(`Cannot find application: ${appName}`);
    }
}
//# sourceMappingURL=JsInspector.js.map