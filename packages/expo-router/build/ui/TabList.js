"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabTrigger = exports.TabList = void 0;
const react_1 = require("react");
const react_native_1 = require("react-native");
const Tab_hooks_1 = require("./Tab-hooks");
const common_1 = require("./common");
function TabList({ asChild, ...props }) {
    const Comp = asChild ? common_1.ViewSlot : react_native_1.View;
    return <Comp style={styles.tabList} {...props}/>;
}
exports.TabList = TabList;
function TabTrigger({ asChild, name, href, ...props }) {
    const Comp = asChild ? common_1.PressableSlot : react_native_1.Pressable;
    const { switchTab } = (0, Tab_hooks_1.useTabTrigger)();
    const handleOnPress = (0, react_1.useCallback)((event) => {
        props.onPress?.(event);
        if (event?.isDefaultPrevented()) {
            return;
        }
        switchTab(name, href);
    }, [props.onPress]);
    const handleOnLongPress = (0, react_1.useCallback)((event) => {
        props.onLongPress?.(event);
        if (event?.isDefaultPrevented()) {
            return;
        }
        switchTab(name, href);
    }, [props.onPress]);
    return (<Comp style={styles.tabTrigger} {...props} onPress={handleOnPress} onLongPress={handleOnLongPress}>
      {props.children}
    </Comp>);
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
//# sourceMappingURL=TabList.js.map