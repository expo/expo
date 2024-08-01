"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabTrigger = exports.TabList = void 0;
const react_slot_1 = require("@radix-ui/react-slot");
const react_native_1 = require("react-native");
const Link_1 = require("../link/Link");
function TabList({ asChild, ...props }) {
    const Element = asChild ? react_slot_1.Slot : react_native_1.View;
    return <Element style={styles.tabList} {...props}/>;
}
exports.TabList = TabList;
function TabTrigger(props) {
    return (<Link_1.Link style={styles.tabTrigger} {...props}>
      {props.children}
    </Link_1.Link>);
}
exports.TabTrigger = TabTrigger;
const styles = react_native_1.StyleSheet.create({
    tabList: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    tabTrigger: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
});
//# sourceMappingURL=Tabs.list.js.map