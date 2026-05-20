"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GestureState = exports.GestureHandlerRootView = exports.PanGestureHandler = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const Dummy = ({ children }) => (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: children });
exports.PanGestureHandler = Dummy;
exports.GestureHandlerRootView = react_native_1.View;
exports.GestureState = {
    UNDETERMINED: 0,
    FAILED: 1,
    BEGAN: 2,
    CANCELLED: 3,
    ACTIVE: 4,
    END: 5,
};
//# sourceMappingURL=GestureHandler.js.map