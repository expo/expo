"use strict";
/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTextColor = exports.getHighlightColor = exports.getDividerColor = exports.getWarningHighlightColor = exports.getLogColor = exports.getErrorDarkColor = exports.getErrorColor = exports.getFatalDarkColor = exports.getFatalColor = exports.getWarningDarkColor = exports.getWarningColor = exports.getBackgroundDarkColor = exports.getBackgroundLightColor = exports.getBackgroundColor = void 0;
function getBackgroundColor(opacity) {
    return `rgba(0, 0, 0, ${opacity == null ? 1 : opacity})`;
    // return `rgba(51, 51, 51, ${opacity == null ? 1 : opacity})`;
}
exports.getBackgroundColor = getBackgroundColor;
function getBackgroundLightColor(opacity) {
    return `rgba(69, 69, 69, ${opacity == null ? 1 : opacity})`;
}
exports.getBackgroundLightColor = getBackgroundLightColor;
function getBackgroundDarkColor(opacity) {
    return `rgba(34, 34, 34, ${opacity == null ? 1 : opacity})`;
}
exports.getBackgroundDarkColor = getBackgroundDarkColor;
function getWarningColor(opacity) {
    return `rgba(250, 186, 48, ${opacity == null ? 1 : opacity})`;
}
exports.getWarningColor = getWarningColor;
function getWarningDarkColor(opacity) {
    return `rgba(224, 167, 8, ${opacity == null ? 1 : opacity})`;
}
exports.getWarningDarkColor = getWarningDarkColor;
function getFatalColor(opacity) {
    return `rgba(243, 83, 105, ${opacity == null ? 1 : opacity})`;
}
exports.getFatalColor = getFatalColor;
function getFatalDarkColor(opacity) {
    return `rgba(208, 75, 95, ${opacity == null ? 1 : opacity})`;
}
exports.getFatalDarkColor = getFatalDarkColor;
function getErrorColor(opacity) {
    return `rgba(243, 83, 105, ${opacity == null ? 1 : opacity})`;
}
exports.getErrorColor = getErrorColor;
function getErrorDarkColor(opacity) {
    return `rgba(208, 75, 95, ${opacity == null ? 1 : opacity})`;
}
exports.getErrorDarkColor = getErrorDarkColor;
function getLogColor(opacity) {
    return `rgba(119, 119, 119, ${opacity == null ? 1 : opacity})`;
}
exports.getLogColor = getLogColor;
function getWarningHighlightColor(opacity) {
    return `rgba(252, 176, 29, ${opacity == null ? 1 : opacity})`;
}
exports.getWarningHighlightColor = getWarningHighlightColor;
function getDividerColor(opacity) {
    return `rgba(255, 255, 255, ${opacity == null ? 1 : opacity})`;
}
exports.getDividerColor = getDividerColor;
function getHighlightColor(opacity) {
    return `rgba(252, 176, 29, ${opacity == null ? 1 : opacity})`;
}
exports.getHighlightColor = getHighlightColor;
function getTextColor(opacity) {
    return `rgba(255, 255, 255, ${opacity == null ? 1 : opacity})`;
}
exports.getTextColor = getTextColor;
//# sourceMappingURL=LogBoxStyle.js.map