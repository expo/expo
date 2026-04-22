"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaskedView = MaskedView;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
let RNCMaskedView;
try {
    // Add try/catch to support usage even if it's not installed, since it's optional.
    // Newer versions of Metro will handle it properly.
    RNCMaskedView = require('@react-native-masked-view/masked-view').default;
}
catch (e) {
    // Ignore
}
const isMaskedViewAvailable = react_native_1.UIManager.getViewManagerConfig('RNCMaskedView') != null;
function MaskedView({ children, ...rest }) {
    if (isMaskedViewAvailable && RNCMaskedView) {
        return (0, jsx_runtime_1.jsx)(RNCMaskedView, { ...rest, children: children });
    }
    return children;
}
//# sourceMappingURL=MaskedViewNative.js.map