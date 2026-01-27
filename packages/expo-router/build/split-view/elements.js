"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SplitViewColumn = SplitViewColumn;
exports.SplitViewInspector = SplitViewInspector;
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const experimental_1 = require("react-native-screens/experimental");
function SplitViewColumn(props) {
    return (<experimental_1.Split.Column>
      <react_native_safe_area_context_1.SafeAreaProvider>{props.children}</react_native_safe_area_context_1.SafeAreaProvider>
    </experimental_1.Split.Column>);
}
/**
 * @platform iOS 26+
 */
function SplitViewInspector(props) {
    return <experimental_1.Split.Inspector>{props.children}</experimental_1.Split.Inspector>;
}
//# sourceMappingURL=elements.js.map