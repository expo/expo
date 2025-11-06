"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SplitViewColumn = SplitViewColumn;
exports.SplitViewInspector = SplitViewInspector;
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const experimental_1 = require("react-native-screens/experimental");
function SplitViewColumn(props) {
    return (<experimental_1.SplitViewScreen.Column>
      <react_native_safe_area_context_1.SafeAreaProvider>{props.children}</react_native_safe_area_context_1.SafeAreaProvider>
    </experimental_1.SplitViewScreen.Column>);
}
function SplitViewInspector(props) {
    return <experimental_1.SplitViewScreen.Inspector>{props.children}</experimental_1.SplitViewScreen.Inspector>;
}
//# sourceMappingURL=elements.js.map