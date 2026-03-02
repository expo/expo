"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterToolbarHost = RouterToolbarHost;
exports.RouterToolbarItem = RouterToolbarItem;
const jetpack_compose_1 = require("@expo/ui/jetpack-compose");
const react_1 = require("react");
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
function RouterToolbarHost(props) {
    // TODO(@ubax): This will not work with bottom tabs. At the moment the only way of getting the correct
    // bottom inset in bottom tabs is to use `SafeAreaView` from `react-native-screens/experimental`.
    const { bottom } = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    return (<react_native_1.View style={[styles.hostContainer, { bottom }]} pointerEvents="box-none">
      <jetpack_compose_1.Host matchContents>
        <jetpack_compose_1.HorizontalFloatingToolbar>{props.children}</jetpack_compose_1.HorizontalFloatingToolbar>
      </jetpack_compose_1.Host>
    </react_native_1.View>);
}
function RouterToolbarItem(props) {
    if (props.hidden) {
        return null;
    }
    if (props.type === 'fixedSpacer' || props.type === 'fluidSpacer') {
        if (process.env.NODE_ENV !== 'production') {
            // prettier-ignore
            console.warn('Stack.Toolbar.Spacer is not supported on Android. The spacer will not render.');
        }
        return null;
    }
    if (props.type === 'searchBar') {
        if (process.env.NODE_ENV !== 'production') {
            // prettier-ignore
            console.warn('Stack.Toolbar.SearchBarSlot is not supported on Android. The search bar will not render.');
        }
        return null;
    }
    if (hasChildren(props.children)) {
        if (process.env.NODE_ENV !== 'production') {
            // prettier-ignore
            console.warn('Stack.Toolbar.View is not supported on Android. Custom views inside the toolbar will not render.');
        }
        return null;
    }
    if (!props.source) {
        if (process.env.NODE_ENV !== 'production') {
            // prettier-ignore
            console.warn('Stack.Toolbar.Button on Android requires an ImageSourcePropType icon. SF Symbols and xcasset icons are not supported. Use the `icon` prop with a require() or { uri } source, or use <Stack.Toolbar.Icon src={...} />.');
        }
        return null;
    }
    return (<jetpack_compose_1.IconButton onPress={props.onSelected} disabled={props.disabled}>
      <jetpack_compose_1.Icon source={props.source} tintColor={props.tintColor} size={24}/>
    </jetpack_compose_1.IconButton>);
}
function hasChildren(children) {
    if (children == null)
        return false;
    return react_1.Children.count(children) > 0;
}
const styles = react_native_1.StyleSheet.create({
    hostContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
    },
});
//# sourceMappingURL=native.android.js.map