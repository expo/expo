"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTabSlot = exports.defaultTabsSlotRender = exports.useTab = exports.TabSlot = exports.useTabSlot = void 0;
const react_1 = require("react");
const react_native_1 = require("react-native");
const react_native_screens_1 = require("react-native-screens");
const TabContext_1 = require("./TabContext");
const useNavigation_1 = require("../useNavigation");
function useTabSlot({ detachInactiveScreens = react_native_1.Platform.OS === 'web' ||
    react_native_1.Platform.OS === 'android' ||
    react_native_1.Platform.OS === 'ios', style, renderFn = defaultTabsSlotRender, } = {}) {
    const state = (0, react_1.useContext)(TabContext_1.TabsStateContext);
    const descriptors = (0, react_1.useContext)(TabContext_1.TabsDescriptorsContext);
    const focusedRouteKey = state.routes[state.index].key;
    const [loaded, setLoaded] = (0, react_1.useState)({ [focusedRouteKey]: true });
    if (!loaded[focusedRouteKey]) {
        setLoaded({ ...loaded, [focusedRouteKey]: true });
    }
    return (<react_native_screens_1.ScreenContainer enabled={detachInactiveScreens} hasTwoStates style={style || styles.flexBoxGrowOnly}>
      {state.routes.map((route, index) => {
            const descriptor = descriptors[route.key];
            return (<TabContext_1.TabContext.Provider key={descriptor.route.key} value={descriptor.options}>
            {renderFn(descriptor, {
                    index,
                    isFocused: state.index === index,
                    loaded: loaded[route.key],
                    detachInactiveScreens,
                })}
          </TabContext_1.TabContext.Provider>);
        })}
    </react_native_screens_1.ScreenContainer>);
}
exports.useTabSlot = useTabSlot;
function TabSlot(props) {
    return useTabSlot(props);
}
exports.TabSlot = TabSlot;
function useTab() {
    const navigation = (0, useNavigation_1.useNavigation)();
    const options = (0, react_1.useContext)(TabContext_1.TabContext);
    return {
        options,
        setOptions: navigation.setOptions,
    };
}
exports.useTab = useTab;
function defaultTabsSlotRender(descriptor, { isFocused, loaded, detachInactiveScreens }) {
    const { lazy = true, unmountOnBlur, freezeOnBlur } = descriptor.options;
    if (unmountOnBlur && !isFocused) {
        return null;
    }
    if (lazy && !loaded && !isFocused) {
        // Don't render a lazy screen if we've never navigated to it
        return null;
    }
    return (<react_native_screens_1.Screen key={descriptor.route.key} enabled={detachInactiveScreens} activityState={isFocused ? 2 : 0} freezeOnBlur={freezeOnBlur} style={styles.flexBoxGrowOnly}>
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