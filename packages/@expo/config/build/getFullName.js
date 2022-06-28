"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAccountUsername = getAccountUsername;
exports.getFullName = getFullName;

function _getUserState() {
  const data = require("./getUserState");

  _getUserState = function () {
    return data;
  };

  return data;
}

const ANONYMOUS_USERNAME = 'anonymous';
/**
 * Used in expo-constants to generate the `id` property statically for an app in custom managed workflow.
 * This `id` is used for legacy Expo services AuthSession proxy and Expo notifications device ID.
 *
 * @param manifest
 * @returns
 */

function getFullName(manifest) {
  const username = getAccountUsername(manifest);
  return `@${username}/${manifest.slug}`;
}

function getAccountUsername(manifest = {}) {
  var _getUserState$read$au;

  // TODO: Must match what's generated in Expo Go.
  const username = manifest.owner || process.env.EXPO_CLI_USERNAME || process.env.EAS_BUILD_USERNAME;

  if (username) {
    return username;
  } // Statically get the username from the global user state.


  return ((_getUserState$read$au = (0, _getUserState().getUserState)().read().auth) === null || _getUserState$read$au === void 0 ? void 0 : _getUserState$read$au.username) || ANONYMOUS_USERNAME;
}
//# sourceMappingURL=getFullName.js.map