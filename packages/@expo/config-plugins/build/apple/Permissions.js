"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createPermissionsPlugin = exports.applyPermissions = void 0;
function _debug() {
  const data = _interopRequireDefault(require("debug"));
  _debug = function () {
    return data;
  };
  return data;
}
function _applePlugins() {
  const data = require("../plugins/apple-plugins");
  _applePlugins = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const debug = (0, _debug().default)(`expo:config-plugins:apple:permissions`);
const applyPermissions = (defaults, permissions, infoPlist) => {
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
};

/**
 * Helper method for creating mods to apply default permissions.
 *
 * @param action
 */
exports.applyPermissions = applyPermissions;
const createPermissionsPlugin = applePlatform => (defaults, name) => {
  const withApplePermissions = (config, permissions) => (0, _applePlugins().withInfoPlist)(applePlatform)(config, async config => {
    config.modResults = applyPermissions(defaults, permissions, config.modResults);
    return config;
  });
  if (name) {
    Object.defineProperty(withApplePermissions, 'name', {
      value: name
    });
  }
  return withApplePermissions;
};
exports.createPermissionsPlugin = createPermissionsPlugin;
//# sourceMappingURL=Permissions.js.map