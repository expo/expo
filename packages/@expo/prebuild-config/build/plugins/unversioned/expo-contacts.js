"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
function _configPlugins() {
  const data = require("@expo/config-plugins");
  _configPlugins = function () {
    return data;
  };
  return data;
}
function _createLegacyPlugin() {
  const data = require("./createLegacyPlugin");
  _createLegacyPlugin = function () {
    return data;
  };
  return data;
}
const withAccessesContactNotes = config => {
  return (0, _configPlugins().withEntitlementsPlist)(config, config => {
    config.modResults = setAccessesContactNotes(config, config.modResults);
    return config;
  });
};
function setAccessesContactNotes(config, entitlementsPlist) {
  if (config.ios?.accessesContactNotes) {
    return {
      ...entitlementsPlist,
      'com.apple.developer.contacts.notes': true
    };
  }
  return entitlementsPlist;
}
var _default = exports.default = (0, _createLegacyPlugin().createLegacyPlugin)({
  packageName: 'expo-contacts',
  fallback: withAccessesContactNotes
});
//# sourceMappingURL=expo-contacts.js.map