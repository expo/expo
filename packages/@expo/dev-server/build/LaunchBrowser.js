"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.launchBrowserAsync = launchBrowserAsync;
function _os() {
  const data = _interopRequireDefault(require("os"));
  _os = function () {
    return data;
  };
  return data;
}
function _LaunchBrowser() {
  const data = require("./LaunchBrowser.types");
  _LaunchBrowser = function () {
    return data;
  };
  return data;
}
function _LaunchBrowserImplLinux() {
  const data = _interopRequireDefault(require("./LaunchBrowserImplLinux"));
  _LaunchBrowserImplLinux = function () {
    return data;
  };
  return data;
}
function _LaunchBrowserImplMacOS() {
  const data = _interopRequireDefault(require("./LaunchBrowserImplMacOS"));
  _LaunchBrowserImplMacOS = function () {
    return data;
  };
  return data;
}
function _LaunchBrowserImplWindows() {
  const data = _interopRequireDefault(require("./LaunchBrowserImplWindows"));
  _LaunchBrowserImplWindows = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
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
  const launchArgs = [`--app=${url}`, '--allow-running-insecure-content', `--user-data-dir=${tempBrowserDir}`, '--no-first-run', '--no-default-browser-check'];
  for (const browserType of [_LaunchBrowser().LaunchBrowserTypes.CHROME, _LaunchBrowser().LaunchBrowserTypes.EDGE]) {
    const isSupported = await browser.isSupportedBrowser(browserType);
    if (isSupported) {
      return browser.launchAsync(browserType, launchArgs);
    }
  }
  throw new Error('[LaunchBrowser] Unable to find a browser on the host to open the inspector. Supported browsers: Google Chrome, Microsoft Edge');
}
function createBrowser() {
  if (_os().default.platform() === 'darwin') {
    return new (_LaunchBrowserImplMacOS().default)();
  }
  if (_os().default.platform() === 'win32' || IS_WSL) {
    return new (_LaunchBrowserImplWindows().default)();
  }
  if (_os().default.platform() === 'linux') {
    return new (_LaunchBrowserImplLinux().default)();
  }
  throw new Error('[LaunchBrowser] Unsupported host platform');
}
//# sourceMappingURL=LaunchBrowser.js.map