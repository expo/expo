"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaybeScreen = exports.MaybeScreenContainer = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
let Screens;
try {
    Screens = require('react-native-screens');
}
catch (e) {
    // Ignore
}
const MaybeScreenContainer = ({ enabled, ...rest }) => {
    if (Screens != null) {
        return (0, jsx_runtime_1.jsx)(Screens.ScreenContainer, { enabled: enabled, ...rest });
    }
    return (0, jsx_runtime_1.jsx)(react_native_1.View, { ...rest });
};
exports.MaybeScreenContainer = MaybeScreenContainer;
const MaybeScreen = ({ enabled, active, ...rest }) => {
    if (Screens != null) {
        return (0, jsx_runtime_1.jsx)(Screens.Screen, { enabled: enabled, activityState: active, ...rest });
    }
    return (0, jsx_runtime_1.jsx)(react_native_1.View, { ...rest });
};
exports.MaybeScreen = MaybeScreen;
//# sourceMappingURL=Screens.js.map