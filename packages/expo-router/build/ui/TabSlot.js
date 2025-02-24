import { useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { ScreenContainer, Screen } from 'react-native-screens';
import { TabContext } from './TabContext';
import { useNavigatorContext } from '../views/Navigator';
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
export function useTabSlot({ detachInactiveScreens = ['android', 'ios', 'web'].includes(Platform.OS), style, renderFn = defaultTabsSlotRender, } = {}) {
    const { state, descriptors } = useNavigatorContext();
    const focusedRouteKey = state.routes[state.index].key;
    const [loaded, setLoaded] = useState({ [focusedRouteKey]: true });
    if (!loaded[focusedRouteKey]) {
        setLoaded({ ...loaded, [focusedRouteKey]: true });
    }
    return (<ScreenContainer enabled={detachInactiveScreens} hasTwoStates style={[styles.screenContainer, style]}>
      {state.routes.map((route, index) => {
            const descriptor = descriptors[route.key];
            return (<TabContext.Provider key={descriptor.route.key} value={descriptor.options}>
            {renderFn(descriptor, {
                    index,
                    isFocused: state.index === index,
                    loaded: loaded[route.key],
                    detachInactiveScreens,
                })}
          </TabContext.Provider>);
        })}
    </ScreenContainer>);
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
export function TabSlot(props) {
    return useTabSlot(props);
}
/**
 * @hidden
 */
export function defaultTabsSlotRender(descriptor, { isFocused, loaded, detachInactiveScreens }) {
    const { lazy = true, unmountOnBlur, freezeOnBlur } = descriptor.options;
    if (unmountOnBlur && !isFocused) {
        return null;
    }
    if (lazy && !loaded && !isFocused) {
        // Don't render a lazy screen if we've never navigated to it
        return null;
    }
    return (<Screen key={descriptor.route.key} enabled={detachInactiveScreens} activityState={isFocused ? 2 : 0} freezeOnBlur={freezeOnBlur} style={[styles.screen, isFocused ? styles.focused : styles.unfocused]}>
      {descriptor.render()}
    </Screen>);
}
/**
 * @hidden
 */
export function isTabSlot(child) {
    return child.type === TabSlot;
}
const styles = StyleSheet.create({
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