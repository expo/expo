var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _DevSettings = _interopRequireDefault(require("../Utilities/DevSettings"));
var _NativeDevToolsSettingsManager = _interopRequireDefault(require("./NativeDevToolsSettingsManager"));
module.exports = {
  setConsolePatchSettings: function setConsolePatchSettings(newSettings) {
    _NativeDevToolsSettingsManager.default == null ? void 0 : _NativeDevToolsSettingsManager.default.setConsolePatchSettings(newSettings);
  },
  getConsolePatchSettings: function getConsolePatchSettings() {
    return _NativeDevToolsSettingsManager.default == null ? void 0 : _NativeDevToolsSettingsManager.default.getConsolePatchSettings();
  },
  setProfilingSettings: function setProfilingSettings(newSettings) {
    if ((_NativeDevToolsSettingsManager.default == null ? void 0 : _NativeDevToolsSettingsManager.default.setProfilingSettings) != null) {
      _NativeDevToolsSettingsManager.default.setProfilingSettings(newSettings);
    }
  },
  getProfilingSettings: function getProfilingSettings() {
    if ((_NativeDevToolsSettingsManager.default == null ? void 0 : _NativeDevToolsSettingsManager.default.getProfilingSettings) != null) {
      return _NativeDevToolsSettingsManager.default.getProfilingSettings();
    }
    return null;
  },
  reload: function reload() {
    _DevSettings.default == null ? void 0 : _DevSettings.default.reload();
  }
};