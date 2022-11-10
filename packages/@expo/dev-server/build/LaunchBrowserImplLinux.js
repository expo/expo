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

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Browser implementation for Linux
 */
class LaunchBrowserImplLinux {
  constructor() {
    _defineProperty(this, "_appId", void 0);

    _defineProperty(this, "_process", void 0);

    _defineProperty(this, "MAP", {
      [_LaunchBrowser().LaunchBrowserTypes.CHROME]: ['google-chrome', 'google-chrome-stable', 'chromium'],
      [_LaunchBrowser().LaunchBrowserTypes.EDGE]: ['microsoft-edge', 'microsoft-edge-dev']
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

  async createTempBrowserDir(baseDirName) {
    return _path().default.join(require('temp-dir'), baseDirName);
  }

  async launchAsync(browserType, args) {
    const appId = await this.getAppId(browserType);
    this._process = await _open().default.openApp(appId, {
      arguments: args
    });
    return this;
  }

  async close() {
    var _this$_process;

    (_this$_process = this._process) === null || _this$_process === void 0 ? void 0 : _this$_process.kill();
    this._process = undefined;
    this._appId = undefined;
  }

}

exports.default = LaunchBrowserImplLinux;
//# sourceMappingURL=LaunchBrowserImplLinux.js.map