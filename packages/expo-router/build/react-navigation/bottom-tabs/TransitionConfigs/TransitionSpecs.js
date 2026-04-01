"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftSpec = exports.FadeSpec = void 0;
const react_native_1 = require("react-native");
exports.FadeSpec = {
    animation: 'timing',
    config: {
        duration: 150,
        easing: react_native_1.Easing.in(react_native_1.Easing.linear),
    },
};
exports.ShiftSpec = {
    animation: 'timing',
    config: {
        duration: 150,
        easing: react_native_1.Easing.inOut(react_native_1.Easing.ease),
    },
};
//# sourceMappingURL=TransitionSpecs.js.map