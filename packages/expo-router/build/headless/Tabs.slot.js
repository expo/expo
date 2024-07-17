"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultTabsSlotRender = exports.TabSlot = exports.useTabSlot = void 0;
const react_1 = require("react");
const react_native_1 = require("react-native");
const native_1 = require("@react-navigation/native");
const react_native_screens_1 = require("react-native-screens");
const Tabs_common_1 = require("./Tabs.common");
function useTabSlot({ detachInactiveScreens = react_native_1.Platform.OS === 'web' ||
    react_native_1.Platform.OS === 'android' ||
    react_native_1.Platform.OS === 'ios', renderFn = defaultTabsSlotRender, } = {}) {
    const { state, descriptors } = (0, Tabs_common_1.useTabsContext)();
    const focusedRouteKey = state.routes[state.index].key;
    const [loaded, setLoaded] = (0, react_1.useState)({ [focusedRouteKey]: true });
    if (!loaded[focusedRouteKey]) {
        setLoaded({ ...loaded, [focusedRouteKey]: true });
    }
    return state.routes.map((route, index) => {
        return renderFn(route, descriptors[route.key], {
            index,
            isFocused: state.index === index,
            loaded: loaded[route.key],
            detachInactiveScreens,
        });
    });
}
exports.useTabSlot = useTabSlot;
function TabSlot() {
    return useTabSlot();
}
exports.TabSlot = TabSlot;
function defaultTabsSlotRender(route, descriptor, { isFocused, loaded, detachInactiveScreens }) {
    const { lazy = true, unmountOnBlur, freezeOnBlur } = descriptor.options;
    if (unmountOnBlur && !isFocused) {
        return null;
    }
    if (lazy && !loaded && !isFocused) {
        // Don't render a lazy screen if we've never navigated to it
        return null;
    }
    return (<native_1.NavigationContext.Provider value={descriptor.navigation}>
      <native_1.NavigationRouteContext.Provider value={route}>
        <react_native_screens_1.ScreenContainer enabled={detachInactiveScreens} hasTwoStates key={route.key} style={[react_native_1.StyleSheet.absoluteFill, { zIndex: isFocused ? 0 : -1 }]}>
          <react_native_screens_1.Screen enabled={detachInactiveScreens} activityState={isFocused ? 2 : 0} freezeOnBlur={freezeOnBlur}>
            {descriptor.render()}
          </react_native_screens_1.Screen>
        </react_native_screens_1.ScreenContainer>
      </native_1.NavigationRouteContext.Provider>
    </native_1.NavigationContext.Provider>);
}
exports.defaultTabsSlotRender = defaultTabsSlotRender;
//# sourceMappingURL=Tabs.slot.js.map