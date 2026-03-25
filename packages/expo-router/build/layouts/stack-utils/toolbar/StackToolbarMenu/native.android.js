"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeToolbarMenuAction = exports.NativeToolbarMenu = void 0;
const jetpack_compose_1 = require("@expo/ui/jetpack-compose");
const modifiers_1 = require("@expo/ui/jetpack-compose/modifiers");
const react_1 = require("react");
const color_1 = require("../../../../color");
const primitives_1 = require("../../../../primitives");
const AnimatedItemContainer_1 = require("../../../../toolbar/AnimatedItemContainer");
const children_1 = require("../../../../utils/children");
const arrowRightIcon = require('../../../../../assets/arrow_right.xml');
const checkmarkIcon = require('../../../../../assets/checkmark.xml');
/**
 * Context for propagating menu close callbacks from root to nested menus.
 * - `null` means root level (no parent menu)
 * - A function means nested level (call to close entire menu chain)
 */
const ToolbarMenuCloseContext = (0, react_1.createContext)(null);
const DEFAULT_BACKGROUND_COLOR = () => color_1.Color.android.dynamic.surfaceContainer;
const DEFAULT_TINT_COLOR = () => color_1.Color.android.dynamic.onSurface;
/**
 * Native toolbar menu component for Android bottom toolbar.
 * Renders as a DropdownMenu with IconButton trigger (root) or DropdownMenuItem trigger (nested).
 */
const NativeToolbarMenu = (props) => {
    const [expanded, setExpanded] = (0, react_1.useState)(false);
    const parentClose = (0, react_1.use)(ToolbarMenuCloseContext);
    const isNested = parentClose !== null;
    const tintColor = props.imageRenderingMode === 'original' ? undefined : (props.tintColor ?? DEFAULT_TINT_COLOR());
    const closeMenu = (0, react_1.useCallback)(() => {
        setExpanded(false);
        parentClose?.();
    }, [parentClose]);
    // Inline nested: render children directly with a divider separator
    if (isNested && props.inline) {
        return (<>
        <jetpack_compose_1.HorizontalDivider />
        {props.children}
      </>);
    }
    // Non-inline nested: DropdownMenu with DropdownMenuItem trigger
    if (isNested) {
        const trailingIcon = (<jetpack_compose_1.DropdownMenuItem.TrailingIcon>
        <jetpack_compose_1.Icon source={arrowRightIcon} tintColor={tintColor} size={24}/>
      </jetpack_compose_1.DropdownMenuItem.TrailingIcon>);
        const leadingIcon = props.source ? (<jetpack_compose_1.DropdownMenuItem.LeadingIcon>
        <jetpack_compose_1.Icon source={props.source} tintColor={tintColor} size={24}/>
      </jetpack_compose_1.DropdownMenuItem.LeadingIcon>) : null;
        return (<jetpack_compose_1.DropdownMenu expanded={expanded} onDismissRequest={() => setExpanded(false)} modifiers={[(0, modifiers_1.background)(DEFAULT_BACKGROUND_COLOR())]}>
        <jetpack_compose_1.DropdownMenu.Trigger>
          <jetpack_compose_1.DropdownMenuItem onClick={() => {
                if (!props.disabled)
                    setExpanded(true);
            }} enabled={!props.disabled}>
            {leadingIcon}
            <jetpack_compose_1.DropdownMenuItem.Text>
              <jetpack_compose_1.Text color={typeof props.tintColor === 'string' ? props.tintColor : DEFAULT_TINT_COLOR()}>
                {props.label}
              </jetpack_compose_1.Text>
            </jetpack_compose_1.DropdownMenuItem.Text>
            {trailingIcon}
          </jetpack_compose_1.DropdownMenuItem>
        </jetpack_compose_1.DropdownMenu.Trigger>
        <jetpack_compose_1.DropdownMenu.Items>
          <ToolbarMenuCloseContext value={closeMenu}>{props.children}</ToolbarMenuCloseContext>
        </jetpack_compose_1.DropdownMenu.Items>
      </jetpack_compose_1.DropdownMenu>);
    }
    // Root: AnimatedItemContainer + IconButton trigger + DropdownMenu
    if (!props.source) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('Stack.Toolbar.Menu on Android requires an ImageSourcePropType icon. SF Symbols and xcasset icons are not supported. Use the `icon` prop with a require() or { uri } source, or use <Stack.Toolbar.Icon src={...} />.');
        }
        return null;
    }
    return (<AnimatedItemContainer_1.AnimatedItemContainer visible={!props.hidden}>
      <jetpack_compose_1.DropdownMenu expanded={expanded} onDismissRequest={() => setExpanded(false)} modifiers={[(0, modifiers_1.background)(DEFAULT_BACKGROUND_COLOR())]}>
        <jetpack_compose_1.DropdownMenu.Trigger>
          <jetpack_compose_1.IconButton onClick={() => setExpanded(true)} enabled={!props.disabled}>
            <jetpack_compose_1.Icon source={props.source} tintColor={tintColor} size={24}/>
          </jetpack_compose_1.IconButton>
        </jetpack_compose_1.DropdownMenu.Trigger>
        <jetpack_compose_1.DropdownMenu.Items>
          <ToolbarMenuCloseContext value={closeMenu}>{props.children}</ToolbarMenuCloseContext>
        </jetpack_compose_1.DropdownMenu.Items>
      </jetpack_compose_1.DropdownMenu>
    </AnimatedItemContainer_1.AnimatedItemContainer>);
};
exports.NativeToolbarMenu = NativeToolbarMenu;
/**
 * Native toolbar menu action component for Android.
 * Renders as a DropdownMenuItem.
 */
const NativeToolbarMenuAction = (props) => {
    const closeMenu = (0, react_1.use)(ToolbarMenuCloseContext);
    const tintColor = props.destructive
        ? color_1.Color.android.material.error
        : DEFAULT_TINT_COLOR();
    const handleClick = (0, react_1.useCallback)(() => {
        props.onPress?.();
        if (!props.unstable_keepPresented) {
            closeMenu?.();
        }
    }, [props.onPress, props.unstable_keepPresented, closeMenu]);
    const areChildrenString = typeof props.children === 'string';
    const label = areChildrenString
        ? props.children
        : ((0, children_1.getFirstChildOfType)(props.children, primitives_1.Label)?.props.children ?? '');
    if (props.hidden)
        return null;
    return (<jetpack_compose_1.DropdownMenuItem onClick={handleClick} enabled={!props.disabled}>
      <jetpack_compose_1.DropdownMenuItem.Text>
        <jetpack_compose_1.Text color={tintColor}>{label}</jetpack_compose_1.Text>
      </jetpack_compose_1.DropdownMenuItem.Text>
      {props.source && (<jetpack_compose_1.DropdownMenuItem.LeadingIcon>
          <jetpack_compose_1.Icon source={props.source} tintColor={tintColor} size={24}/>
        </jetpack_compose_1.DropdownMenuItem.LeadingIcon>)}
      {props.isOn && (<jetpack_compose_1.DropdownMenuItem.TrailingIcon>
          <jetpack_compose_1.Icon source={checkmarkIcon} tintColor={tintColor} size={24}/>
        </jetpack_compose_1.DropdownMenuItem.TrailingIcon>)}
    </jetpack_compose_1.DropdownMenuItem>);
};
exports.NativeToolbarMenuAction = NativeToolbarMenuAction;
//# sourceMappingURL=native.android.js.map