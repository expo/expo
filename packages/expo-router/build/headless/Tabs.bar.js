"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabTrigger = exports.TabList = void 0;
const react_native_1 = require("react-native");
function TabList({ as: As = react_native_1.View, style = { flexDirection: 'row', justifyContent: 'space-between' }, ...props }) {
    return <As {...props} style={style}/>;
}
exports.TabList = TabList;
function TabTrigger({ as: As = react_native_1.Pressable, ...props }) {
    return <As {...props}>{props.children}</As>;
}
exports.TabTrigger = TabTrigger;
//# sourceMappingURL=Tabs.bar.js.map