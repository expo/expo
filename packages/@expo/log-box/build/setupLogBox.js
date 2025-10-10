"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupLogBox = setupLogBox;
const react_1 = __importDefault(require("react"));
const renderInShadowRoot_1 = require("./utils/renderInShadowRoot");
if (process.env.NODE_ENV === 'development' && process.env.EXPO_OS === 'web') {
    // Stack traces are big with React Navigation
    // TODO: Can this be part of the `setupLogBox` hook? Or do we need install early?
    require('./LogBox').default.install();
}
let isInstalled = false;
function setupLogBox() {
    if (process.env.NODE_ENV === 'development' && process.env.EXPO_OS === 'web') {
        if (isInstalled) {
            return undefined;
        }
        const ErrorToast = require('./toast/ErrorToast')
            .default;
        (0, renderInShadowRoot_1.renderInShadowRoot)('error-toast', react_1.default.createElement(ErrorToast));
        isInstalled = true;
    }
}
