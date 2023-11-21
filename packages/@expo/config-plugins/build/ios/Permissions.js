"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.applyPermissions = applyPermissions;
exports.createPermissionsPlugin = createPermissionsPlugin;
function _debug() {
  const data = _interopRequireDefault(require("debug"));
  _debug = function () {
    return data;
  };
  return data;
}
function _iosPlugins() {
  const data = require("../plugins/ios-plugins");
  _iosPlugins = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const debug = (0, _debug().default)('expo:config-plugins:ios:permissions');
function applyPermissions(defaults, permissions, infoPlist) {
  const entries = Object.entries(defaults);
  if (entries.length === 0) {
    debug(`No defaults provided: ${JSON.stringify(permissions)}`);
  }
  for (const [permission, description] of entries) {
    if (permissions[permission] === false) {
      debug(`Deleting "${permission}"`);
      delete infoPlist[permission];
    } else {
      infoPlist[permission] = permissions[permission] || infoPlist[permission] || description;
      debug(`Setting "${permission}" to "${infoPlist[permission]}"`);
    }
  }
  return infoPlist;
}

/**
 * Helper method for creating mods to apply default permissions.
 *
 * @param action
 */
function createPermissionsPlugin(defaults, name) {
  const withIosPermissions = (config, permissions) => (0, _iosPlugins().withInfoPlist)(config, async config => {
    config.modResults = applyPermissions(defaults, permissions, config.modResults);
    return config;
  });
  if (name) {
    Object.defineProperty(withIosPermissions, 'name', {
      value: name
    });
  }
  return withIosPermissions;
}
//# sourceMappingURL=Permissions.js.map