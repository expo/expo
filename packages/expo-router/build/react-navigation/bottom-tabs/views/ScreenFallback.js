"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaybeScreenContainer = void 0;
exports.MaybeScreen = MaybeScreen;
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
    if (Screens?.screensEnabled?.()) {
        return (0, jsx_runtime_1.jsx)(Screens.ScreenContainer, { enabled: enabled, ...rest });
    }
    return (0, jsx_runtime_1.jsx)(react_native_1.View, { ...rest });
};
exports.MaybeScreenContainer = MaybeScreenContainer;
function MaybeScreen({ enabled, active, ...rest }) {
    if (Screens?.screensEnabled?.()) {
        return (0, jsx_runtime_1.jsx)(Screens.Screen, { enabled: enabled, activityState: active, ...rest });
    }
    return (0, jsx_runtime_1.jsx)(react_native_1.View, { ...rest });
}
//# sourceMappingURL=ScreenFallback.js.map