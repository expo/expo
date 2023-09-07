"use strict";
/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const react_native_web_1 = require("react-native-web");
// Ensure events are sent so custom Fast Refresh views are shown.
function showMessage(message, type) {
    react_native_web_1.DeviceEventEmitter.emit('devLoadingView:showMessage', {
        message,
    });
}
function hide() {
    react_native_web_1.DeviceEventEmitter.emit('devLoadingView:hide', {});
}
exports.default = {
    showMessage,
    hide,
};
//# sourceMappingURL=LoadingView.js.map