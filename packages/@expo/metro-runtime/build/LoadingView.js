"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SyntheticPlatformEmitter_1 = __importDefault(require("expo-modules-core/build/SyntheticPlatformEmitter"));
// Ensure events are sent so custom Fast Refresh views are shown.
function showMessage(message, type) {
    SyntheticPlatformEmitter_1.default.emit('devLoadingView:showMessage', {
        message,
    });
}
function hide() {
    SyntheticPlatformEmitter_1.default.emit('devLoadingView:hide', {});
}
exports.default = {
    showMessage,
    hide,
};
//# sourceMappingURL=LoadingView.js.map