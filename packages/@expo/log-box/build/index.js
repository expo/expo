"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withErrorOverlay = withErrorOverlay;
const react_1 = __importDefault(require("react"));
if (process.env.NODE_ENV === 'development' && process.env.EXPO_OS === 'web') {
    // Stack traces are big with React Navigation
    require('./LogBox').default.install();
}
function withErrorOverlay(RootComponent) {
    if (process.env.NODE_ENV === 'development' && process.env.EXPO_OS === 'web') {
        const ErrorToastContainer = require('./ErrorToast')
            .default;
        return function ErrorOverlay(props) {
            return (react_1.default.createElement(ErrorToastContainer, null,
                react_1.default.createElement(RootComponent, { ...props })));
        };
    }
    return RootComponent;
}
