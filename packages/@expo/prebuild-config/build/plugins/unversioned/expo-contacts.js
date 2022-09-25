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
  var _config$ios;

  if ((_config$ios = config.ios) !== null && _config$ios !== void 0 && _config$ios.accessesContactNotes) {
    return { ...entitlementsPlist,
      'com.apple.developer.contacts.notes': true
    };
  }

  return entitlementsPlist;
}

var _default = (0, _createLegacyPlugin().createLegacyPlugin)({
  packageName: 'expo-contacts',
  fallback: withAccessesContactNotes
});

exports.default = _default;
//# sourceMappingURL=expo-contacts.js.map