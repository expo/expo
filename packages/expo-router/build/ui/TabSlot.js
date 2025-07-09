"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTabSlot = useTabSlot;
exports.TabSlot = TabSlot;
exports.defaultTabsSlotRender = defaultTabsSlotRender;
exports.isTabSlot = isTabSlot;
const react_1 = require("react");
const react_native_1 = require("react-native");
const react_native_screens_1 = require("react-native-screens");
const TabContext_1 = require("./TabContext");
const Navigator_1 = require("../views/Navigator");
/**
 * Returns a `ReactElement` of the current tab.
 *
 * @example
 * ```tsx
 * function MyTabSlot() {
 *   const slot = useTabSlot();
 *
 *   return slot;
 * }
 * ```
 */
function useTabSlot({ detachInactiveScreens = ['android', 'ios', 'web'].includes(react_native_1.Platform.OS), style, renderFn = defaultTabsSlotRender, } = {}) {
    const { state, descriptors } = (0, Navigator_1.useNavigatorContext)();
    const focusedRouteKey = state.routes[state.index].key;
    const [loaded, setLoaded] = (0, react_1.useState)({ [focusedRouteKey]: true });
    if (!loaded[focusedRouteKey]) {
        setLoaded({ ...loaded, [focusedRouteKey]: true });
    }
    return (<react_native_screens_1.ScreenContainer enabled={detachInactiveScreens} hasTwoStates style={[styles.screenContainer, style]}>
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
/**
 * Renders the current tab.
 *
 * @see [`useTabSlot`](#usetabslot) for a hook version of this component.
 *
 * @example
 * ```tsx
 * <Tabs>
 *  <TabSlot />
 *  <TabList>
 *   <TabTrigger name="home" href="/" />
 *  </TabList>
 * </Tabs>
 * ```
 */
function TabSlot(props) {
    return useTabSlot(props);
}
/**
 * @hidden
 */
function defaultTabsSlotRender(descriptor, { isFocused, loaded, detachInactiveScreens }) {
    const { lazy = true, unmountOnBlur, freezeOnBlur } = descriptor.options;
    if (unmountOnBlur && !isFocused) {
        return null;
    }
    if (lazy && !loaded && !isFocused) {
        // Don't render a lazy screen if we've never navigated to it
        return null;
    }
    return (<react_native_screens_1.Screen key={descriptor.route.key} enabled={detachInactiveScreens} activityState={isFocused ? 2 : 0} freezeOnBlur={freezeOnBlur} style={[styles.screen, isFocused ? styles.focused : styles.unfocused]}>
      {descriptor.render()}
    </react_native_screens_1.Screen>);
}
/**
 * @hidden
 */
function isTabSlot(child) {
    return child.type === TabSlot;
}
const styles = react_native_1.StyleSheet.create({
    screen: {
        flex: 1,
        position: 'relative',
        height: '100%',
    },
    screenContainer: {
        flexShrink: 0,
        flexGrow: 1,
    },
    focused: {
        zIndex: 1,
        display: 'flex',
        flexShrink: 0,
        flexGrow: 1,
    },
    unfocused: {
        zIndex: -1,
        display: 'none',
        flexShrink: 1,
        flexGrow: 0,
    },
});
//# sourceMappingURL=TabSlot.js.map