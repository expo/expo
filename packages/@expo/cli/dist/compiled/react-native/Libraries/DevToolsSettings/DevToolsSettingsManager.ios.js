var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _Settings = _interopRequireDefault(require("../Settings/Settings"));
var _DevSettings = _interopRequireDefault(require("../Utilities/DevSettings"));
var CONSOLE_PATCH_SETTINGS_KEY = 'ReactDevTools::ConsolePatchSettings';
var PROFILING_SETTINGS_KEY = 'ReactDevTools::ProfilingSettings';
var DevToolsSettingsManager = {
  setConsolePatchSettings: function setConsolePatchSettings(newConsolePatchSettings) {
    _Settings.default.set((0, _defineProperty2.default)({}, CONSOLE_PATCH_SETTINGS_KEY, newConsolePatchSettings));
  },
  getConsolePatchSettings: function getConsolePatchSettings() {
    var value = _Settings.default.get(CONSOLE_PATCH_SETTINGS_KEY);
    if (typeof value === 'string') {
      return value;
    }
    return null;
  },
  setProfilingSettings: function setProfilingSettings(newProfilingSettings) {
    _Settings.default.set((0, _defineProperty2.default)({}, PROFILING_SETTINGS_KEY, newProfilingSettings));
  },
  getProfilingSettings: function getProfilingSettings() {
    var value = _Settings.default.get(PROFILING_SETTINGS_KEY);
    if (typeof value === 'string') {
      return value;
    }
    return null;
  },
  reload: function reload() {
    _DevSettings.default == null ? void 0 : _DevSettings.default.reload();
  }
};
module.exports = DevToolsSettingsManager;
//# sourceMappingURL=DevToolsSettingsManager.ios.js.map