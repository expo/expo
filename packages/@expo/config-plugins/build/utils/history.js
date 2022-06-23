"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addHistoryItem = addHistoryItem;
exports.getHistoryItem = getHistoryItem;

function getHistoryItem(config, name) {
  var _config$_internal$plu, _config$_internal, _config$_internal$plu2;

  return (_config$_internal$plu = (_config$_internal = config._internal) === null || _config$_internal === void 0 ? void 0 : (_config$_internal$plu2 = _config$_internal.pluginHistory) === null || _config$_internal$plu2 === void 0 ? void 0 : _config$_internal$plu2[name]) !== null && _config$_internal$plu !== void 0 ? _config$_internal$plu : null;
}

function addHistoryItem(config, item) {
  if (!config._internal) {
    config._internal = {};
  }

  if (!config._internal.pluginHistory) {
    config._internal.pluginHistory = {};
  }

  if (!item.version) {
    item.version = 'UNVERSIONED';
  }

  config._internal.pluginHistory[item.name] = item;
  return config;
}
//# sourceMappingURL=history.js.map