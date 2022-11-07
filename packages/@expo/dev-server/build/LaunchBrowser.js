"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.launchBrowserAsync = launchBrowserAsync;

function osascript() {
  const data = _interopRequireWildcard(require("@expo/osascript"));

  osascript = function () {
    return data;
  };

  return data;
}

function _spawnAsync() {
  const data = _interopRequireDefault(require("@expo/spawn-async"));

  _spawnAsync = function () {
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

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const IS_WSL = require('is-wsl') && !require('is-docker')();

/**
 * Supported browser types
 */
var BrowserTypes;
/**
 * Internal browser implementation constraints
 */

(function (BrowserTypes) {
  BrowserTypes[BrowserTypes["CHROME"] = 0] = "CHROME";
  BrowserTypes[BrowserTypes["EDGE"] = 1] = "EDGE";
})(BrowserTypes || (BrowserTypes = {}));

/**
 * Launch a browser for JavaScript inspector
 */
async function launchBrowserAsync(url) {
  // For dev-client connecting metro in LAN, the request to fetch sourcemaps may be blocked by Chromium
  // with insecure-content (https page send xhr for http resource).
  // Adding `--allow-running-insecure-content` to overcome this limitation
  // without users manually allow insecure-content in site settings.
  // However, if there is existing chromium browser process, the argument will not take effect.
  // We also pass a `--user-data-dir=` as temporary profile and force chromium to create new browser process.
  const tempBrowserDir = await createTempBrowserDir();
  const launchArgs = [`--app=${url}`, '--allow-running-insecure-content', `--user-data-dir=${tempBrowserDir}`, '--no-first-run', '--no-default-browser-check'];
  const browser = createBrowser();

  for (const browserType of [BrowserTypes.CHROME, BrowserTypes.EDGE]) {
    const isSupported = await browser.isSupportedBrowser(browserType);

    if (isSupported) {
      return browser.launchAsync(browserType, launchArgs);
    }
  }

  throw new Error('[LaunchBrowser] Unable to find a browser on the host to open the inspector. Supported browsers: Google Chrome, Microsoft Edge');
}

function createBrowser() {
  if (_os().default.platform() === 'darwin') {
    return new BrowserImplMacOS();
  }

  if (_os().default.platform() === 'win32' || IS_WSL) {
    return new BrowserImplWindows();
  }

  if (_os().default.platform() === 'linux') {
    return new BrowserImplLinux();
  }

  throw new Error('[LaunchBrowser] Unsupported host platform');
}
/**
 * Create a temp folder for chromium user profile
 */


async function createTempBrowserDir() {
  const suffix = 'expo-inspector';
  let tmpDir;

  if (IS_WSL) {
    // On WSL, the browser is actually launched in host, the `temp-dir` returns the linux /tmp path where host browsers cannot reach into.
    // We should get the temp path through the `$TEMP` windows environment variable.
    tmpDir = (await (0, _spawnAsync().default)('powershell.exe', ['-c', 'echo "$Env:TEMP"'])).stdout.trim();
    return `${tmpDir}\\${suffix}`;
  } else {
    tmpDir = require('temp-dir');
    return _path().default.join(tmpDir, suffix);
  }
}
/**
 * Browser implementation for macOS
 */


class BrowserImplMacOS {
  constructor() {
    _defineProperty(this, "_process", void 0);

    _defineProperty(this, "MAP", {
      [BrowserTypes.CHROME]: 'google chrome',
      [BrowserTypes.EDGE]: 'microsoft edge'
    });
  }

  async isSupportedBrowser(browserType) {
    let result = false;

    try {
      await osascript().execAsync(`id of application "${this.MAP[browserType]}"`);
      result = true;
    } catch {
      result = false;
    }

    return result;
  }

  async launchAsync(browserType, args) {
    var _globSync;

    const appDirectory = await osascript().execAsync(`POSIX path of (path to application "${this.MAP[browserType]}")`);
    const appPath = (_globSync = (0, _glob().sync)('Contents/MacOS/*', {
      cwd: appDirectory.trim(),
      absolute: true
    })) === null || _globSync === void 0 ? void 0 : _globSync[0];

    if (!appPath) {
      throw new Error(`Cannot find application path from ${appDirectory}Contents/MacOS`);
    }

    this._process = (0, _child_process().spawn)(appPath, args, {
      stdio: 'ignore'
    });
    return this;
  }

  async close() {
    var _this$_process;

    (_this$_process = this._process) === null || _this$_process === void 0 ? void 0 : _this$_process.kill();
    this._process = undefined;
  }

}
/**
 * Browser implementation for Windows and WSL
 *
 * To minimize the difference between Windows and WSL, the implementation wraps all spawn calls through powershell.
 */


class BrowserImplWindows {
  constructor() {
    _defineProperty(this, "_appId", void 0);

    _defineProperty(this, "MAP", {
      [BrowserTypes.CHROME]: {
        appId: 'chrome',
        fullName: 'Google Chrome'
      },
      [BrowserTypes.EDGE]: {
        appId: 'msedge',
        fullName: 'Microsoft Edge'
      }
    });
  }

  async isSupportedBrowser(browserType) {
    let result = false;

    try {
      const {
        status
      } = await (0, _spawnAsync().default)('powershell.exe', ['-c', `Get-Package -Name '${this.MAP[browserType].fullName}'`], {
        stdio: 'ignore'
      });
      result = status === 0;
    } catch {
      result = false;
    }

    return result;
  }

  async launchAsync(browserType, args) {
    const appId = this.MAP[browserType].appId;
    await _open().default.openApp(appId, {
      arguments: args
    });
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
        await (0, _spawnAsync().default)('powershell.exe', ['-c', `taskkill.exe /pid @(Get-WmiObject Win32_Process -Filter "name = '${this._appId}.exe' AND CommandLine LIKE '%chrome-devtools-frontend.appspot.com%'" | Select-Object -ExpandProperty ProcessId)`], {
          stdio: 'ignore'
        });
      } catch {}

      this._appId = undefined;
    }
  }

}
/**
 * Browser implementation for Linux
 */


class BrowserImplLinux {
  constructor() {
    _defineProperty(this, "_appId", void 0);

    _defineProperty(this, "_process", void 0);

    _defineProperty(this, "MAP", {
      [BrowserTypes.CHROME]: ['google-chrome', 'google-chrome-stable', 'chromium'],
      [BrowserTypes.EDGE]: ['microsoft-edge', 'microsoft-edge-dev']
    });
  }

  /**
   * On Linux, the supported appId is an array, this function finds the available appId and caches it
   */
  async getAppId(browserType) {
    if (this._appId == null || !this.MAP[browserType].includes(this._appId)) {
      for (const appId of this.MAP[browserType]) {
        try {
          const {
            status
          } = await (0, _spawnAsync().default)('which', [appId], {
            stdio: 'ignore'
          });

          if (status === 0) {
            this._appId = appId;
            break;
          }
        } catch {}
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
    } catch {
      result = false;
    }

    return result;
  }

  async launchAsync(browserType, args) {
    const appId = await this.getAppId(browserType);
    this._process = await _open().default.openApp(appId, {
      arguments: args
    });
    return this;
  }

  async close() {
    var _this$_process2;

    (_this$_process2 = this._process) === null || _this$_process2 === void 0 ? void 0 : _this$_process2.kill();
    this._process = undefined;
    this._appId = undefined;
  }

}
//# sourceMappingURL=LaunchBrowser.js.map