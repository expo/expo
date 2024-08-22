"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTabTrigger = exports.isTabTrigger = exports.TabTrigger = void 0;
const react_slot_1 = require("@radix-ui/react-slot");
const native_1 = require("@react-navigation/native");
const react_1 = require("react");
const react_native_1 = require("react-native");
const TabContext_1 = require("./TabContext");
const imperative_api_1 = require("../imperative-api");
const TabTriggerSlot = react_slot_1.Slot;
function TabTrigger({ asChild, name, href, reset, ...props }) {
    const { switchTab, isFocused } = useTabTrigger(name);
    const pressReset = reset === true;
    const longPressReset = reset === true || typeof reset === 'string' ? reset === 'longPress' : Boolean(reset);
    const handleOnPress = (0, react_1.useCallback)((event) => {
        props.onPress?.(event);
        if (event?.isDefaultPrevented()) {
            return;
        }
        switchTab(name, pressReset);
    }, [props.onPress, pressReset]);
    const handleOnLongPress = (0, react_1.useCallback)((event) => {
        props.onLongPress?.(event);
        if (event?.isDefaultPrevented()) {
            return;
        }
        switchTab(name, longPressReset);
    }, [props.onPress]);
    // Pressable doesn't accept the extra props, so only pass them if we are using asChild
    if (asChild) {
        return (<TabTriggerSlot style={styles.tabTrigger} {...props} onPress={handleOnPress} onLongPress={handleOnLongPress} isFocused={isFocused}>
        {props.children}
      </TabTriggerSlot>);
    }
    else {
        return (<react_native_1.Pressable style={styles.tabTrigger} {...props} onPress={handleOnPress} onLongPress={handleOnLongPress}>
        {props.children}
      </react_native_1.Pressable>);
    }
}
exports.TabTrigger = TabTrigger;
function isTabTrigger(child) {
    return child.type === TabTrigger;
}
exports.isTabTrigger = isTabTrigger;
function useTabTrigger(name) {
    const navigation = (0, native_1.useNavigation)();
    const triggerMap = (0, react_1.useContext)(TabContext_1.TabTriggerMapContext);
    const state = (0, react_1.useContext)(TabContext_1.TabsStateContext);
    const config = triggerMap[name];
    const { index } = config;
    if (!config) {
        throw new Error(`Unable to find trigger with name ${name}`);
    }
    const switchTab = (0, react_1.useCallback)((name, reset) => {
        if (config.type === 'internal') {
            const action = {
                type: 'SWITCH_TABS',
                source: '',
                payload: {
                    name,
                    reset,
                },
            };
            return navigation.dispatch(action);
        }
        else {
            return imperative_api_1.router.navigate(config.href);
        }
    }, [navigation]);
    return {
        switchTab,
        name,
        index,
        isFocused: state.index === index,
    };
}
exports.useTabTrigger = useTabTrigger;
const styles = react_native_1.StyleSheet.create({
    tabTrigger: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
});
//# sourceMappingURL=TabTrigger.js.map