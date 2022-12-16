"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.closeJsInspector = closeJsInspector;
exports.openJsInspector = openJsInspector;
exports.queryAllInspectorAppsAsync = queryAllInspectorAppsAsync;
exports.queryInspectorAppAsync = queryInspectorAppAsync;
function _nodeFetch() {
  const data = _interopRequireDefault(require("node-fetch"));
  _nodeFetch = function () {
    return data;
  };
  return data;
}
function _LaunchBrowser() {
  const data = require("./LaunchBrowser");
  _LaunchBrowser = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
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
  openingBrowserInstance = await (0, _LaunchBrowser().launchBrowserAsync)(url);
}
async function closeJsInspector() {
  var _openingBrowserInstan;
  await ((_openingBrowserInstan = openingBrowserInstance) === null || _openingBrowserInstan === void 0 ? void 0 : _openingBrowserInstan.close());
  openingBrowserInstance = null;
}
async function queryInspectorAppAsync(metroServerOrigin, appId) {
  var _apps$find;
  const apps = await queryAllInspectorAppsAsync(metroServerOrigin);
  return (_apps$find = apps.find(app => app.description === appId)) !== null && _apps$find !== void 0 ? _apps$find : null;
}
async function queryAllInspectorAppsAsync(metroServerOrigin) {
  const resp = await (0, _nodeFetch().default)(`${metroServerOrigin}/json/list`);
  const apps = transformApps(await resp.json());
  // Only use targets with better reloading support
  return apps.filter(app => app.title === 'React Native Experimental (Improved Chrome Reloads)');
}

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
    if (app.description === "don't use") {
      var _deviceIdToAppId$devi;
      const deviceId = app.id.split('-')[0];
      app.description = (_deviceIdToAppId$devi = deviceIdToAppId[deviceId]) !== null && _deviceIdToAppId$devi !== void 0 ? _deviceIdToAppId$devi : app.description;
    }
    return app;
  });
}
//# sourceMappingURL=JsInspector.js.map