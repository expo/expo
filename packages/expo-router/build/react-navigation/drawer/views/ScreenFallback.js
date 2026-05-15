"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaybeScreenContainer = void 0;
exports.MaybeScreen = MaybeScreen;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const elements_1 = require("../../elements");
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
function MaybeScreen({ visible, children, ...rest }) {
    if (Screens?.screensEnabled?.()) {
        return ((0, jsx_runtime_1.jsx)(Screens.Screen, { activityState: visible ? 2 : 0, ...rest, children: children }));
    }
    return ((0, jsx_runtime_1.jsx)(elements_1.ResourceSavingView, { visible: visible, ...rest, children: children }));
}
//# sourceMappingURL=ScreenFallback.js.map