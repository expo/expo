"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SplitViewColumn = SplitViewColumn;
exports.SplitViewInspector = SplitViewInspector;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const experimental_1 = require("react-native-screens/experimental");
function SplitViewColumn(props) {
    return ((0, jsx_runtime_1.jsx)(experimental_1.Split.Column, { children: (0, jsx_runtime_1.jsx)(react_native_safe_area_context_1.SafeAreaProvider, { children: props.children }) }));
}
/**
 * @platform iOS 26+
 */
function SplitViewInspector(props) {
    return (0, jsx_runtime_1.jsx)(experimental_1.Split.Inspector, { children: props.children });
}
//# sourceMappingURL=elements.js.map