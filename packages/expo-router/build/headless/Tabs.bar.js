"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabTrigger = exports.TabList = void 0;
const react_native_1 = require("react-native");
function TabList({ as: As = react_native_1.View, ...props }) {
    return <As style={styles.tabList} {...props}/>;
}
exports.TabList = TabList;
function TabTrigger({ as: As = react_native_1.Pressable, style, ...props }) {
    return (<As style={styles.tabTrigger} {...props}>
      {props.children}
    </As>);
}
exports.TabTrigger = TabTrigger;
const styles = react_native_1.StyleSheet.create({
    tabList: { flexDirection: 'row', justifyContent: 'space-between' },
    tabTrigger: { flexDirection: 'row', justifyContent: 'space-between' },
});
//# sourceMappingURL=Tabs.bar.js.map