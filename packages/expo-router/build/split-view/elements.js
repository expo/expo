"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SplitViewColumn = SplitViewColumn;
exports.SplitViewInspector = SplitViewInspector;
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const react_native_screens_1 = require("react-native-screens");
function SplitViewColumn(props) {
    return (<react_native_screens_1.SplitViewScreen.Column>
      <react_native_safe_area_context_1.SafeAreaProvider>{props.children}</react_native_safe_area_context_1.SafeAreaProvider>
    </react_native_screens_1.SplitViewScreen.Column>);
}
function SplitViewInspector(props) {
    return <react_native_screens_1.SplitViewScreen.Inspector>{props.children}</react_native_screens_1.SplitViewScreen.Inspector>;
}
//# sourceMappingURL=elements.js.map