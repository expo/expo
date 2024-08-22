"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTabSlot = exports.defaultTabsSlotRender = exports.TabSlot = exports.useTabSlot = void 0;
const react_slot_1 = require("@radix-ui/react-slot");
const react_1 = require("react");
const react_native_1 = require("react-native");
const react_native_screens_1 = require("react-native-screens");
const TabContext_1 = require("./TabContext");
function useTabSlot({ detachInactiveScreens = react_native_1.Platform.OS === 'web' ||
    react_native_1.Platform.OS === 'android' ||
    react_native_1.Platform.OS === 'ios', renderFn = defaultTabsSlotRender, } = {}) {
    const state = (0, react_1.useContext)(TabContext_1.TabsStateContext);
    const descriptors = (0, react_1.useContext)(TabContext_1.TabsDescriptorsContext);
    const focusedRouteKey = state.routes[state.index].key;
    const [loaded, setLoaded] = (0, react_1.useState)({ [focusedRouteKey]: true });
    if (!loaded[focusedRouteKey]) {
        setLoaded({ ...loaded, [focusedRouteKey]: true });
    }
    return (<react_native_screens_1.ScreenContainer enabled={detachInactiveScreens} hasTwoStates>
      {state.routes.map((route, index) => {
            return renderFn(descriptors[route.key], {
                index,
                isFocused: state.index === index,
                loaded: loaded[route.key],
            });
        })}
    </react_native_screens_1.ScreenContainer>);
}
exports.useTabSlot = useTabSlot;
function TabSlot({ options, asChild, ...props }) {
    const Element = asChild ? react_slot_1.Slot : react_native_1.View;
    return (<Element style={styles.flexBoxGrowOnly} {...props}>
      {useTabSlot(options)}
    </Element>);
}
exports.TabSlot = TabSlot;
function defaultTabsSlotRender(descriptor, { isFocused, loaded }) {
    const { lazy = true, unmountOnBlur, freezeOnBlur } = descriptor.options;
    if (unmountOnBlur && !isFocused) {
        return null;
    }
    if (lazy && !loaded && !isFocused) {
        // Don't render a lazy screen if we've never navigated to it
        return null;
    }
    return (<react_native_screens_1.Screen key={descriptor.route.key} activityState={isFocused ? 2 : 0} enabled={isFocused} freezeOnBlur={freezeOnBlur}>
      <react_native_1.View style={[styles.flexBoxGrowOnly, isFocused ? styles.focused : styles.unfocused]}>
        {descriptor.render()}
      </react_native_1.View>
    </react_native_screens_1.Screen>);
}
exports.defaultTabsSlotRender = defaultTabsSlotRender;
function isTabSlot(child) {
    return child.type === TabSlot;
}
exports.isTabSlot = isTabSlot;
const styles = react_native_1.StyleSheet.create({
    flexBoxGrowOnly: {
        flexShrink: 0,
        flexGrow: 1,
        position: 'relative',
    },
    focused: {
        zIndex: 0,
        flexGrow: 1,
        flexShrink: 0,
    },
    unfocused: {
        zIndex: -1,
        display: 'none',
    },
});
//# sourceMappingURL=TabSlot.js.map