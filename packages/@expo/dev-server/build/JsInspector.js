"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.closeJsInspector = closeJsInspector;
exports.openJsInspector = openJsInspector;
exports.queryAllInspectorAppsAsync = queryAllInspectorAppsAsync;
exports.queryInspectorAppAsync = queryInspectorAppAsync;

function osascript() {
  const data = _interopRequireWildcard(require("@expo/osascript"));

  osascript = function () {
    return data;
  };

  return data;
}

function _child_process() {
  const data = require("child_process");

  _child_process = function () {
    return data;
  };

  return data;
}

function _glob() {
  const data = require("glob");

  _glob = function () {
    return data;
  };

  return data;
}

function _nodeFetch() {
  const data = _interopRequireDefault(require("node-fetch"));

  _nodeFetch = function () {
    return data;
  };

  return data;
}

function _open() {
  const data = _interopRequireDefault(require("open"));

  _open = function () {
    return data;
  };

  return data;
}

function _os() {
  const data = _interopRequireDefault(require("os"));

  _os = function () {
    return data;
  };

  return data;
}

function _path() {
  const data = _interopRequireDefault(require("path"));

  _path = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

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
  const ws = app.webSocketDebuggerUrl.replace(/^ws:\/\//, '');
  const url = `${urlBase}?panel=sources&v8only=true&ws=${encodeURIComponent(ws)}`;
  launchChromiumAsync(url);
}

function closeJsInspector() {
  if (openingChildProcess != null) {
    openingChildProcess.kill();
    openingChildProcess = null;
  }
}

async function queryInspectorAppAsync(metroServerOrigin, appId) {
  var _apps$find;

  const apps = await queryAllInspectorAppsAsync(metroServerOrigin);
  return (_apps$find = apps.find(app => app.description === appId)) !== null && _apps$find !== void 0 ? _apps$find : null;
}

async function queryAllInspectorAppsAsync(metroServerOrigin) {
  const resp = await (0, _nodeFetch().default)(`${metroServerOrigin}/json/list`);
  const apps = transformApps(await resp.json()); // Only use targets with better reloading support

  return apps.filter(app => app.title === 'React Native Experimental (Improved Chrome Reloads)');
} // The description of `React Native Experimental (Improved Chrome Reloads)` target is `don't use` from metro.
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

async function launchChromiumAsync(url) {
  // For dev-client connecting metro in LAN, the request to fetch sourcemaps may be blocked by Chromium
  // with insecure-content (https page send xhr for http resource).
  // Adding `--allow-running-insecure-content` to overcome this limitation
  // without users manually allow insecure-content in site settings.
  // However, if there is existing chromium browser process, the argument will not take effect.
  // We also pass a `--user-data-dir=` as temporary profile and force chromium to create new browser process.
  const tmpDir = require('temp-dir');

  const tempProfileDir = _path().default.join(tmpDir, 'expo-inspector');

  const launchArgs = [`--app=${url}`, '--allow-running-insecure-content', `--user-data-dir=${tempProfileDir}`, '--no-first-run', '--no-default-browser-check'];
  const supportedChromiums = [_open().default.apps.chrome, _open().default.apps.edge];

  for (const chromium of supportedChromiums) {
    try {
      await launchAppAsync(chromium, launchArgs);
      return;
    } catch {}
  }

  throw new Error('Unable to find a browser on the host to open the inspector. Supported browsers: Google Chrome, Microsoft Edge');
}

async function launchAppAsync(appName, launchArgs) {
  if (_os().default.platform() === 'darwin' && !Array.isArray(appName)) {
    var _globSync;

    const appDirectory = await osascript().execAsync(`POSIX path of (path to application "${appName}")`);
    const appPath = (_globSync = (0, _glob().sync)('Contents/MacOS/*', {
      cwd: appDirectory.trim(),
      absolute: true
    })) === null || _globSync === void 0 ? void 0 : _globSync[0];

    if (!appPath) {
      throw new Error(`Cannot find application path from ${appDirectory}Contents/MacOS`);
    }

    closeJsInspector();
    openingChildProcess = (0, _child_process().spawn)(appPath, launchArgs, {
      stdio: 'ignore'
    });
    return;
  }

  const result = await _open().default.openApp(appName, {
    arguments: launchArgs,
    newInstance: true,
    wait: true
  });

  if (result.exitCode !== 0) {
    throw new Error(`Cannot find application: ${appName}`);
  }
}
//# sourceMappingURL=JsInspector.js.map