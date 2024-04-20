"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withFinalizedMod = void 0;
function _withMod() {
  const data = require("./withMod");
  _withMod = function () {
    return data;
  };
  return data;
}
/**
 * Mods that don't modify any data, all unresolved functionality is performed inside a finalized mod.
 * All finalized mods run after all the other mods.
 *
 * @param config
 * @param platform
 * @param action
 */
const withFinalizedMod = (config, [platform, action]) => {
  return (0, _withMod().withMod)(config, {
    platform,
    mod: 'finalized',
    action
  });
};
exports.withFinalizedMod = withFinalizedMod;
//# sourceMappingURL=withFinalizedMod.js.map