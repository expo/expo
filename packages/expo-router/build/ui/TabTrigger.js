"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabTrigger = TabTrigger;
exports.isTabTrigger = isTabTrigger;
exports.useTabTrigger = useTabTrigger;
const react_slot_1 = require("@radix-ui/react-slot");
const react_1 = require("react");
const react_native_1 = require("react-native");
const TabContext_1 = require("./TabContext");
const getPathFromState_1 = require("../fork/getPathFromState");
const imperative_api_1 = require("../imperative-api");
const useLinkToPathProps_1 = require("../link/useLinkToPathProps");
const matchers_1 = require("../matchers");
const Navigator_1 = require("../views/Navigator");
const TabTriggerSlot = react_slot_1.Slot;
/**
 * Creates a trigger to navigate to a tab. When used as child of `TabList`, its
 * functionality slightly changes since the `href` prop is required,
 * and the trigger also defines what routes are present in the `Tabs`.
 *
 * When used outside of `TabList`, this component no longer requires an `href`.
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
function TabTrigger({ asChild, name, href, reset = 'onFocus', ...props }) {
    const { trigger, triggerProps } = useTabTrigger({
        name,
        reset,
        ...props,
    });
    // Pressable doesn't accept the extra props, so only pass them if we are using asChild
    if (asChild) {
        return (<TabTriggerSlot style={styles.tabTrigger} {...props} {...triggerProps} href={trigger?.resolvedHref}>
        {props.children}
      </TabTriggerSlot>);
    }
    else {
        // These props are not typed, but are allowed by React Native Web
        const reactNativeWebProps = { href: trigger?.resolvedHref };
        return (<react_native_1.Pressable style={styles.tabTrigger} {...reactNativeWebProps} {...props} {...triggerProps}>
        {props.children}
      </react_native_1.Pressable>);
    }
}
/**
 * @hidden
 */
function isTabTrigger(child) {
    return child.type === TabTrigger;
}
/**
 * Utility hook creating custom `TabTrigger`.
 */
function useTabTrigger(options) {
    const { state, navigation } = (0, Navigator_1.useNavigatorContext)();
    const { name, reset, onPress, onLongPress } = options;
    const triggerMap = (0, react_1.use)(TabContext_1.TabTriggerMapContext);
    const getTrigger = (0, react_1.useCallback)((name) => {
        const config = triggerMap[name];
        if (!config) {
            return;
        }
        return {
            isFocused: state.index === config.index,
            route: state.routes[config.index],
            resolvedHref: (0, matchers_1.stripGroupSegmentsFromPath)((0, getPathFromState_1.appendBaseUrl)(config.href)),
            ...config,
        };
    }, [triggerMap]);
    const trigger = name !== undefined ? getTrigger(name) : undefined;
    const switchTab = (0, react_1.useCallback)((name, options) => {
        const config = triggerMap[name];
        if (config) {
            if (config.type === 'external') {
                return imperative_api_1.router.navigate(config.href);
            }
            else {
                return navigation?.dispatch({
                    type: 'JUMP_TO',
                    payload: {
                        name,
                        ...options,
                    },
                });
            }
        }
        else {
            return navigation?.dispatch({
                type: 'JUMP_TO',
                payload: {
                    name,
                },
            });
        }
    }, [navigation, triggerMap]);
    const handleOnPress = (0, react_1.useCallback)((event) => {
        onPress?.(event);
        if (!trigger)
            return;
        if (event?.isDefaultPrevented())
            return;
        navigation?.emit({
            type: 'tabPress',
            target: trigger.type === 'internal' ? trigger.route.key : trigger?.href,
            canPreventDefault: true,
        });
        if (!(0, useLinkToPathProps_1.shouldHandleMouseEvent)(event))
            return;
        switchTab(name, { reset: reset !== 'onLongPress' ? reset : undefined });
    }, [onPress, name, reset, trigger]);
    const handleOnLongPress = (0, react_1.useCallback)((event) => {
        onPress?.(event);
        if (!trigger)
            return;
        if (event?.isDefaultPrevented())
            return;
        navigation?.emit({
            type: 'tabLongPress',
            target: trigger.type === 'internal' ? trigger.route.key : trigger?.href,
        });
        if (!(0, useLinkToPathProps_1.shouldHandleMouseEvent)(event))
            return;
        switchTab(name, {
            reset: reset === 'onLongPress' ? 'always' : reset,
        });
    }, [onLongPress, name, reset, trigger]);
    const triggerProps = {
        isFocused: Boolean(trigger?.isFocused),
        onPress: handleOnPress,
        onLongPress: handleOnLongPress,
    };
    return {
        switchTab,
        getTrigger,
        trigger,
        triggerProps,
    };
}
const styles = react_native_1.StyleSheet.create({
    tabTrigger: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
});
//# sourceMappingURL=TabTrigger.js.map