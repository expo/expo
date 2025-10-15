"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SplitViewColumn = SplitViewColumn;
exports.SplitViewInspector = SplitViewInspector;
const experimental_1 = require("react-native-screens/experimental");
function SplitViewColumn(props) {
    return <experimental_1.SplitViewScreen.Column>{props.children}</experimental_1.SplitViewScreen.Column>;
}
function SplitViewInspector(props) {
    return <experimental_1.SplitViewScreen.Inspector>{props.children}</experimental_1.SplitViewScreen.Inspector>;
}
//# sourceMappingURL=elements.js.map