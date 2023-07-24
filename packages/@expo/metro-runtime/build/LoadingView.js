"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const expo_modules_core_1 = require("expo-modules-core");
// Ensure events are sent so custom Fast Refresh views are shown.
function showMessage(message, type) {
    expo_modules_core_1.SyntheticPlatformEmitter.emit("devLoadingView:showMessage", {
        message,
    });
}
function hide() {
    expo_modules_core_1.SyntheticPlatformEmitter.emit("devLoadingView:hide", {});
}
module.exports = {
    showMessage,
    hide,
};
exports.default = {
    showMessage,
    hide,
};
//# sourceMappingURL=LoadingView.js.map