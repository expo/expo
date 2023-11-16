"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addHistoryItem = exports.getHistoryItem = void 0;
function getHistoryItem(config, name) {
    return config._internal?.pluginHistory?.[name] ?? null;
}
exports.getHistoryItem = getHistoryItem;
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
exports.addHistoryItem = addHistoryItem;
