"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
function _spawnAsync() {
  const data = _interopRequireDefault(require("@expo/spawn-async"));
  _spawnAsync = function () {
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
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
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
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
const IS_WSL = require('is-wsl') && !require('is-docker')();

/**
 * Browser implementation for Windows and WSL
 *
 * To minimize the difference between Windows and WSL, the implementation wraps all spawn calls through powershell.
 */
class LaunchBrowserImplWindows {
  constructor() {
    _defineProperty(this, "_appId", void 0);
    _defineProperty(this, "MAP", {
      [_LaunchBrowser().LaunchBrowserTypes.CHROME]: {
        appId: 'chrome',
        fullName: 'Google Chrome'
      },
      [_LaunchBrowser().LaunchBrowserTypes.EDGE]: {
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
  async createTempBrowserDir(baseDirName) {
    let tmpDir;
    if (IS_WSL) {
      // On WSL, the browser is actually launched in host, the `temp-dir` returns the linux /tmp path where host browsers cannot reach into.
      // We should get the temp path through the `$TEMP` windows environment variable.
      tmpDir = (await (0, _spawnAsync().default)('powershell.exe', ['-c', 'echo "$Env:TEMP"'])).stdout.trim();
      return `${tmpDir}\\${baseDirName}`;
    } else {
      tmpDir = require('temp-dir');
      return _path().default.join(tmpDir, baseDirName);
    }
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
exports.default = LaunchBrowserImplWindows;
//# sourceMappingURL=LaunchBrowserImplWindows.js.map