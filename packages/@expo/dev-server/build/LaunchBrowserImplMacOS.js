"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
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
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
/**
 * Browser implementation for macOS
 */
class LaunchBrowserImplMacOS {
  constructor() {
    _defineProperty(this, "_process", void 0);
    _defineProperty(this, "MAP", {
      [_LaunchBrowser().LaunchBrowserTypes.CHROME]: 'google chrome',
      [_LaunchBrowser().LaunchBrowserTypes.EDGE]: 'microsoft edge'
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
  async createTempBrowserDir(baseDirName) {
    return _path().default.join(require('temp-dir'), baseDirName);
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
exports.default = LaunchBrowserImplMacOS;
//# sourceMappingURL=LaunchBrowserImplMacOS.js.map