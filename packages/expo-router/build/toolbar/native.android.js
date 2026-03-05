"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterToolbarHost = RouterToolbarHost;
exports.RouterToolbarItem = RouterToolbarItem;
exports.RouterToolbarMenu = RouterToolbarMenu;
const jetpack_compose_1 = require("@expo/ui/jetpack-compose");
const modifiers_1 = require("@expo/ui/jetpack-compose/modifiers");
const react_1 = require("react");
const react_native_1 = require("react-native");
const color_1 = require("../color");
function RouterToolbarHost(props) {
    return (<react_native_1.View style={[styles.hostContainer]} pointerEvents="box-none">
      <jetpack_compose_1.Host style={{ width: '100%', height: '100%' }}>
        <jetpack_compose_1.Box modifiers={[(0, modifiers_1.fillMaxWidth)(), (0, modifiers_1.imePadding)(), (0, modifiers_1.safeDrawingPadding)()]} contentAlignment="bottomCenter">
          <jetpack_compose_1.HorizontalFloatingToolbar modifiers={[(0, modifiers_1.height)(64)]}>
            {props.children}
          </jetpack_compose_1.HorizontalFloatingToolbar>
        </jetpack_compose_1.Box>
      </jetpack_compose_1.Host>
    </react_native_1.View>);
}
function RouterToolbarItem(props) {
    if (props.type === 'fluidSpacer') {
        // Silently ignore fluid spacer on android
        return null;
    }
    if (props.type === 'fixedSpacer') {
        if (props.width) {
            return (<AnimatedWrapper visible={!props.hidden}>
          <jetpack_compose_1.Box modifiers={[(0, modifiers_1.width)(props.width)]}/>
        </AnimatedWrapper>);
        }
        return null;
    }
    if (props.type === 'searchBar') {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('Stack.Toolbar.SearchBarSlot is not supported on Android. The search bar will not render.');
        }
        return null;
    }
    if (hasChildren(props.children)) {
        return (<AnimatedWrapper visible={!props.hidden}>
        <jetpack_compose_1.RNHostView matchContents>
          <>{props.children}</>
        </jetpack_compose_1.RNHostView>
      </AnimatedWrapper>);
    }
    if (!props.source) {
        if (process.env.NODE_ENV !== 'production' && !props.mdIconName) {
            console.warn('Stack.Toolbar.Button on Android requires an ImageSourcePropType icon. SF Symbols and xcasset icons are not supported. Use the `icon` prop with a require() or { uri } source, or use <Stack.Toolbar.Icon src={...} />.');
        }
        return null;
    }
    return (<AnimatedWrapper visible={!props.hidden}>
      <jetpack_compose_1.IconButton onPress={props.onSelected} disabled={props.disabled}>
        <jetpack_compose_1.Icon source={props.source} tintColor={props.tintColor} size={24}/>
      </jetpack_compose_1.IconButton>
    </AnimatedWrapper>);
}
function AnimatedWrapper({ visible, children }) {
    return (<jetpack_compose_1.AnimatedVisibility 
    // As mentioned in the docs, `scaleIn` does not animate layout, so we need to combine it with `expandIn` to get the layout animation as well. The same applies to `scaleOut` and `shrinkOut`.
    // https://developer.android.com/reference/kotlin/androidx/compose/animation/package-summary#scaleOut(androidx.compose.animation.core.FiniteAnimationSpec,kotlin.Float,androidx.compose.ui.graphics.TransformOrigin)
    enterTransition={jetpack_compose_1.EnterTransition.scaleIn().plus(jetpack_compose_1.EnterTransition.expandIn())} exitTransition={jetpack_compose_1.ExitTransition.scaleOut().plus(jetpack_compose_1.ExitTransition.shrinkOut())} visible={visible}>
      {children}
    </jetpack_compose_1.AnimatedVisibility>);
}
function renderMenuItems(actions, submenus) {
    const items = actions.map((action, i) => (<jetpack_compose_1.Button key={`action-${i}`} onPress={action.onPress} disabled={action.disabled} elementColors={{
            containerColor: color_1.Color.android.dynamic.surfaceContainer,
            contentColor: color_1.Color.android.dynamic.onSecondaryContainer,
        }}>
      {action.label}
    </jetpack_compose_1.Button>));
    if (submenus) {
        for (let i = 0; i < submenus.length; i++) {
            const sub = submenus[i];
            items.push(<jetpack_compose_1.Submenu key={`submenu-${i}`} button={<jetpack_compose_1.Button>{sub.label}</jetpack_compose_1.Button>}>
          {renderMenuItems(sub.actions, sub.submenus)}
        </jetpack_compose_1.Submenu>);
        }
    }
    return items;
}
function RouterToolbarMenu({ source, tintColor, disabled, hidden, actions, submenus, }) {
    if (!source) {
        return null;
    }
    const menuItems = renderMenuItems(actions, submenus);
    return (<AnimatedWrapper visible={!hidden}>
      <jetpack_compose_1.ContextMenu>
        <jetpack_compose_1.ContextMenu.Trigger>
          <jetpack_compose_1.IconButton disabled={disabled}>
            <jetpack_compose_1.Icon source={source} tintColor={tintColor} size={24}/>
          </jetpack_compose_1.IconButton>
        </jetpack_compose_1.ContextMenu.Trigger>
        <jetpack_compose_1.ContextMenu.Items>{menuItems}</jetpack_compose_1.ContextMenu.Items>
      </jetpack_compose_1.ContextMenu>
    </AnimatedWrapper>);
}
function hasChildren(children) {
    if (children == null)
        return false;
    return react_1.Children.count(children) > 0;
}
const styles = react_native_1.StyleSheet.create({
    hostContainer: {
        position: 'absolute',
        inset: 0,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
});
//# sourceMappingURL=native.android.js.map