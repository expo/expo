"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterToolbarHost = RouterToolbarHost;
exports.RouterToolbarItem = RouterToolbarItem;
exports.RouterToolbarMenu = RouterToolbarMenu;
exports.RouterToolbarMenuItem = RouterToolbarMenuItem;
const jetpack_compose_1 = require("@expo/ui/jetpack-compose");
const modifiers_1 = require("@expo/ui/jetpack-compose/modifiers");
const react_1 = require("react");
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const color_1 = require("../color");
const materialIcon_1 = require("../utils/materialIcon");
const arrowRightIcon = require('expo-router/assets/arrow_right.xml');
const checkIcon = require('expo-router/assets/check.xml');
function RouterToolbarHost(props) {
    const insets = (0, react_native_safe_area_context_1.useSafeAreaInsets)();
    const modifiers = (0, react_1.useMemo)(() => {
        const baseModifiers = [(0, modifiers_1.fillMaxWidth)(), (0, modifiers_1.padding)(0, 0, 0, insets.bottom)];
        if (props.withImePadding) {
            baseModifiers.push((0, modifiers_1.imePadding)());
        }
        return baseModifiers;
    }, [insets.bottom, props.withImePadding]);
    return (<react_native_1.View style={[react_native_1.StyleSheet.absoluteFill]} pointerEvents="box-none">
      <jetpack_compose_1.Host style={{ width: '100%', height: '100%', paddingHorizontal: 24 }}>
        <jetpack_compose_1.Box modifiers={modifiers} contentAlignment="bottomCenter">
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
function hasChildren(children) {
    if (children == null)
        return false;
    return react_1.Children.count(children) > 0;
}
const MenuDismissContext = (0, react_1.createContext)(undefined);
function RouterToolbarMenu(props) {
    const parentDismiss = (0, react_1.use)(MenuDismissContext);
    const isNested = parentDismiss !== undefined;
    if (isNested) {
        return <NestedRouterToolbarMenu {...props} parentDismiss={parentDismiss}/>;
    }
    return <RootRouterToolbarMenu {...props}/>;
}
function RootRouterToolbarMenu(props) {
    const [expanded, setExpanded] = (0, react_1.useState)(false);
    const dismiss = () => setExpanded(false);
    const materialSource = (0, materialIcon_1.useMaterialIconSource)(props.mdIconName);
    const resolvedSource = props.source ?? materialSource;
    const computedHidden = props.hidden || !resolvedSource;
    if (!resolvedSource) {
        if (process.env.NODE_ENV !== 'production' && !props.mdIconName) {
            console.warn('Stack.Toolbar.Menu on Android requires an icon. Use the `icon` or `md` prop.');
        }
    }
    return (<AnimatedWrapper visible={!computedHidden}>
      <jetpack_compose_1.DropdownMenu expanded={expanded} onDismissRequest={dismiss} color={color_1.Color.android.dynamic.surface}>
        <jetpack_compose_1.DropdownMenu.Trigger>
          <jetpack_compose_1.IconButton onPress={() => setExpanded((prev) => !prev)} disabled={props.disabled}>
            {resolvedSource ? (<jetpack_compose_1.Icon source={resolvedSource} tintColor={props.tintColor} size={24}/>) : undefined}
          </jetpack_compose_1.IconButton>
        </jetpack_compose_1.DropdownMenu.Trigger>
        <jetpack_compose_1.DropdownMenu.Items>
          <MenuDismissContext value={dismiss}>{props.children}</MenuDismissContext>
        </jetpack_compose_1.DropdownMenu.Items>
      </jetpack_compose_1.DropdownMenu>
    </AnimatedWrapper>);
}
function NestedRouterToolbarMenu(props) {
    const { parentDismiss, ...menuProps } = props;
    if (menuProps.hidden) {
        return null;
    }
    if (menuProps.inline) {
        return (<MenuDismissContext value={parentDismiss}>
        <jetpack_compose_1.Divider />
        {menuProps.children}
        <jetpack_compose_1.Divider />
      </MenuDismissContext>);
    }
    return <NestedSubmenuDropdown {...menuProps} parentDismiss={parentDismiss}/>;
}
function NestedSubmenuDropdown(props) {
    const [expanded, setExpanded] = (0, react_1.useState)(false);
    const arrowSource = arrowRightIcon;
    const dismiss = () => {
        setExpanded(false);
        props.parentDismiss();
    };
    const trailingIcon = arrowSource ? (<jetpack_compose_1.DropdownMenuItem.TrailingIcon>
      <jetpack_compose_1.Icon source={arrowSource} size={24} tintColor={color_1.Color.android.dynamic.onSurface}/>
    </jetpack_compose_1.DropdownMenuItem.TrailingIcon>) : null;
    return (<jetpack_compose_1.DropdownMenu expanded={expanded} onDismissRequest={() => setExpanded(false)} color={color_1.Color.android.dynamic.surface}>
      <jetpack_compose_1.DropdownMenu.Trigger>
        <jetpack_compose_1.DropdownMenuItem onClick={() => setExpanded(true)}>
          <jetpack_compose_1.DropdownMenuItem.Text>
            <jetpack_compose_1.Text>{props.label ?? ''}</jetpack_compose_1.Text>
          </jetpack_compose_1.DropdownMenuItem.Text>
          {trailingIcon}
        </jetpack_compose_1.DropdownMenuItem>
      </jetpack_compose_1.DropdownMenu.Trigger>
      <jetpack_compose_1.DropdownMenu.Items>
        <MenuDismissContext value={dismiss}>{props.children}</MenuDismissContext>
      </jetpack_compose_1.DropdownMenu.Items>
    </jetpack_compose_1.DropdownMenu>);
}
function RouterToolbarMenuItem(props) {
    const onDismiss = (0, react_1.use)(MenuDismissContext);
    const materialSource = (0, materialIcon_1.useMaterialIconSource)(props.leadingMdIconName);
    const iconSource = props.leadingIconSource ?? materialSource;
    const checkSource = props.isOn ? checkIcon : undefined;
    if (props.hidden) {
        return null;
    }
    const leadingIcon = iconSource ? (<jetpack_compose_1.DropdownMenuItem.LeadingIcon>
      <jetpack_compose_1.Icon source={iconSource} size={24} tintColor={color_1.Color.android.dynamic.onSurface}/>
    </jetpack_compose_1.DropdownMenuItem.LeadingIcon>) : null;
    const trailingIcon = checkSource ? (<jetpack_compose_1.DropdownMenuItem.TrailingIcon>
      <jetpack_compose_1.Icon source={checkSource} size={24} tintColor={color_1.Color.android.dynamic.onSurface}/>
    </jetpack_compose_1.DropdownMenuItem.TrailingIcon>) : null;
    return (<jetpack_compose_1.DropdownMenuItem enabled={props.enabled !== false} onClick={() => {
            props.onPress?.();
            onDismiss?.();
        }}>
      <jetpack_compose_1.DropdownMenuItem.Text>
        <jetpack_compose_1.Text>{props.label}</jetpack_compose_1.Text>
      </jetpack_compose_1.DropdownMenuItem.Text>
      {leadingIcon}
      {trailingIcon}
    </jetpack_compose_1.DropdownMenuItem>);
}
//# sourceMappingURL=native.android.js.map