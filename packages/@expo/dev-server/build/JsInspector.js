"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryAllInspectorAppsAsync = exports.queryInspectorAppAsync = exports.closeJsInspector = exports.openJsInspector = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const LaunchBrowser_1 = require("./LaunchBrowser");
let openingBrowserInstance = null;
async function openJsInspector(app) {
    // To update devtoolsFrontendRev, find the full commit hash in the url:
    // https://chromium.googlesource.com/chromium/src.git/+log/refs/tags/{CHROME_VERSION}/chrome/VERSION
    //
    // 1. Replace {CHROME_VERSION} with the target chrome version
    // 2. Click the first log item in the webpage
    // 3. The full commit hash is the desired revision
    const devtoolsFrontendRev = 'd9568d04d7dd79269c5a655d7ada69650c5a8336'; // Chrome 100.0.4896.75
    const urlBase = `https://chrome-devtools-frontend.appspot.com/serve_rev/@${devtoolsFrontendRev}/inspector.html`;
    const ws = app.webSocketDebuggerUrl.replace(/^ws:\/\//, '');
    const url = `${urlBase}?panel=sources&v8only=true&ws=${encodeURIComponent(ws)}`;
    await closeJsInspector();
    openingBrowserInstance = await (0, LaunchBrowser_1.launchBrowserAsync)(url);
}
exports.openJsInspector = openJsInspector;
async function closeJsInspector() {
    await openingBrowserInstance?.close();
    openingBrowserInstance = null;
}
exports.closeJsInspector = closeJsInspector;
async function queryInspectorAppAsync(metroServerOrigin, appId) {
    const apps = await queryAllInspectorAppsAsync(metroServerOrigin);
    return apps.find((app) => app.description === appId) ?? null;
}
exports.queryInspectorAppAsync = queryInspectorAppAsync;
async function queryAllInspectorAppsAsync(metroServerOrigin) {
    const resp = await (0, node_fetch_1.default)(`${metroServerOrigin}/json/list`);
    const apps = transformApps(await resp.json());
    // Only use targets with better reloading support
    return apps.filter((app) => app.title === 'React Native Experimental (Improved Chrome Reloads)');
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
    return apps.map((app) => {
        if (app.description === "don't use") {
            const deviceId = app.id.split('-')[0];
            app.description = deviceIdToAppId[deviceId] ?? app.description;
        }
        return app;
    });
}
