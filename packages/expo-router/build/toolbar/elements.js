"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolbarHost = exports.ToolbarView = exports.ToolbarSearchBarPlacement = exports.ToolbarSpacer = exports.ToolbarButton = exports.ToolbarMenuAction = exports.ToolbarMenu = void 0;
const react_1 = require("react");
const react_native_1 = require("react-native");
const native_1 = require("./native");
const InternalLinkPreviewContext_1 = require("../link/InternalLinkPreviewContext");
const elements_1 = require("../link/elements");
const native_2 = require("../link/preview/native");
const primitives_1 = require("../primitives");
const children_1 = require("../utils/children");
/**
 * Adds a context menu for to a toolbar.
 *
 * @example
 * ```tsx
 * <Toolbar>
 *   <Toolbar.Menu title="Options">
 *     <Toolbar.MenuAction title="Action 1" onPress={() => {}} />
 *     <Toolbar.MenuAction title="Action 2" onPress={() => {}} />
 *   </Toolbar.Menu>
 * </Toolbar>
 * ```
 *
 * @platform ios
 */
const ToolbarMenu = ({ accessibilityHint, accessibilityLabel, separateBackground, hidesSharedBackground, palette, inline, hidden, subtitle, title, destructive, children, icon, tintColor, variant, style, elementSize, }) => {
    const identifier = (0, react_1.useId)();
    const validChildren = react_1.Children.toArray(children).filter((child) => (0, react_1.isValidElement)(child) && (child.type === exports.ToolbarMenuAction || child.type === exports.ToolbarMenu));
    const label = (0, children_1.getFirstChildOfType)(children, primitives_1.Label);
    const iconComponent = (0, children_1.getFirstChildOfType)(children, primitives_1.Icon);
    const computedTitle = title ?? label?.props.children ?? '';
    const computedIcon = icon ??
        (iconComponent?.props && 'sf' in iconComponent.props ? iconComponent.props.sf : undefined);
    const sf = typeof computedIcon === 'string' ? computedIcon : undefined;
    const titleStyle = react_native_1.StyleSheet.flatten(style);
    return (<native_2.NativeLinkPreviewAction sharesBackground={!separateBackground} hidesSharedBackground={hidesSharedBackground} hidden={hidden} icon={sf} destructive={destructive} subtitle={subtitle} accessibilityLabel={accessibilityLabel} accessibilityHint={accessibilityHint} displayAsPalette={palette} displayInline={inline} preferredElementSize={elementSize} tintColor={tintColor} titleStyle={titleStyle} barButtonItemStyle={variant === 'done' ? 'prominent' : variant} title={computedTitle} onSelected={() => { }} children={validChildren} identifier={identifier}/>);
};
exports.ToolbarMenu = ToolbarMenu;
/**
 * A single action item within a toolbar menu.
 *
 * For available props, see [`LinkMenuActionProps`](./router/#linkmenuactionprops).
 *
 * @example
 * ```tsx
 * <Toolbar>
 *   <Toolbar.Menu title="Options">
 *     <Toolbar.MenuAction title="Action 1" onPress={() => {}} />
 *     <Toolbar.MenuAction title="Action 2" onPress={() => {}} />
 *   </Toolbar.Menu>
 * </Toolbar>
 * ```
 *
 * @platform ios
 */
exports.ToolbarMenuAction = elements_1.LinkMenuAction;
// As noted in https://sebvidal.com/blog/whats-new-in-uikit-26/?utm_source=chatgpt.com#:~:text=It%27s%20worth%20noting%20that%2C%20at%20the%20time%20of%20writing%2C%20bar%20button%20badges%20are%20only%20supported%20in%20navigation%20bars%20%2D%20not%20tool%20bars.
// currently badges are not supported in toolbars, and only in navigation bars.
// Therefore, there is no badge support in ToolbarButton
/**
 * A button component for use in the toolbar.
 * It should only be used as a child of `Toolbar`.
 *
 * @example
 * ```tsx
 * <Toolbar>
 *   <Toolbar.Button icon="magnifyingglass" tintColor={Color.ios.placeholderText} />
 *   <Toolbar.Button>Text Button</Toolbar.Button>
 *   <Toolbar.Button hidden={!isSearchFocused} icon="xmark" onPress={handleClear} />
 * </Toolbar>
 * ```
 *
 * @platform ios
 */
const ToolbarButton = (props) => {
    const id = (0, react_1.useId)();
    const areChildrenString = typeof props.children === 'string';
    const label = areChildrenString
        ? props.children
        : (0, children_1.getFirstChildOfType)(props.children, primitives_1.Label)?.props.children;
    const iconComponent = !props.icon && !areChildrenString ? (0, children_1.getFirstChildOfType)(props.children, primitives_1.Icon) : undefined;
    const icon = props.icon ??
        (iconComponent?.props && 'sf' in iconComponent.props ? iconComponent.props.sf : undefined);
    const sf = typeof icon === 'string' ? icon : undefined;
    return (<native_1.RouterToolbarItem accessibilityHint={props.accessibilityHint} accessibilityLabel={props.accessibilityLabel} barButtonItemStyle={props.variant === 'done' ? 'prominent' : props.variant} disabled={props.disabled} hidden={props.hidden} hidesSharedBackground={props.hidesSharedBackground} identifier={id} onSelected={props.onPress} possibleTitles={props.possibleTitles} selected={props.selected} sharesBackground={!props.separateBackground} systemImageName={sf} title={label} tintColor={props.tintColor} titleStyle={react_native_1.StyleSheet.flatten(props.style)}/>);
};
exports.ToolbarButton = ToolbarButton;
/**
 * A spacer component for the toolbar.
 * Without a width, it creates a flexible spacer that expands to fill available space.
 * With a width, it creates a fixed-width spacer.
 * It should only be used as a child of `Toolbar`.
 *
 * @example
 * ```tsx
 * <Toolbar>
 *   <Toolbar.Spacer />
 *   <Toolbar.Button icon="magnifyingglass" />
 *   <Toolbar.Spacer width={20} />
 *   <Toolbar.Button icon="mic" />
 *   <Toolbar.Spacer />
 * </Toolbar>
 * ```
 *
 * @platform ios
 */
const ToolbarSpacer = (props) => {
    const id = (0, react_1.useId)();
    return (<native_1.RouterToolbarItem hidesSharedBackground={props.hidesSharedBackground} hidden={props.hidden} identifier={id} sharesBackground={props.sharesBackground} type={props.width ? 'fixedSpacer' : 'fluidSpacer'} width={props.width}/>);
};
exports.ToolbarSpacer = ToolbarSpacer;
/**
 * Declares the position of a search bar within the toolbar.
 * It should only be used as a child of `Toolbar`.
 *
 * > **Note**: On iOS 26+, this component specifies where in the toolbar the search bar
 * > (configured via `Stack.SearchBar`) should appear. On iOS 18 and earlier, the search bar
 * > will be shown in the header instead.
 *
 * > **Important**: You must use `Stack.SearchBar` to configure and display the actual
 * > search bar. This component only declares its position in the toolbar.
 *
 * @example
 * ```tsx
 * <Stack.SearchBar placeholder="Search..." />
 * <Toolbar>
 *   <Toolbar.SearchBarPlacement />
 *   <Toolbar.Spacer />
 *   <Toolbar.Button icon="mic" />
 * </Toolbar>
 * ```
 *
 * @platform ios 26+
 */
const ToolbarSearchBarPlacement = ({ hidesSharedBackground, hidden, sharesBackground, }) => {
    const id = (0, react_1.useId)();
    if (process.env.EXPO_OS !== 'ios' || parseInt(String(react_native_1.Platform.Version).split('.')[0], 10) < 26) {
        return null;
    }
    if (hidden) {
        return null;
    }
    return (<native_1.RouterToolbarItem hidesSharedBackground={hidesSharedBackground} identifier={id} sharesBackground={sharesBackground} type="searchBar"/>);
};
exports.ToolbarSearchBarPlacement = ToolbarSearchBarPlacement;
/**
 * A custom view component for the toolbar that can contain any React elements.
 * Useful for embedding custom components.
 * It should only be used as a child of `Toolbar`.
 *
 * The items within the view will be absolutely positioned, so flexbox styles will not work as expected.
 *
 * @example
 * ```tsx
 * <Toolbar>
 *   <Toolbar.Spacer />
 *   <Toolbar.View>
 *     <TextInput
 *       placeholder="Search"
 *       placeholderTextColor={Color.ios.placeholderText}
 *     />
 *   </Toolbar.View>
 *   <Toolbar.View separateBackground>
 *     <Pressable style={{ width: 32, height: 32 }} onPress={handlePress}>
 *       <SymbolView name="plus" size={22} />
 *     </Pressable>
 *   </Toolbar.View>
 * </Toolbar>
 * ```
 *
 * @platform ios
 */
const ToolbarView = ({ children, hidden, hidesSharedBackground, separateBackground, }) => {
    const id = (0, react_1.useId)();
    return (<native_1.RouterToolbarItem hidesSharedBackground={hidesSharedBackground} hidden={hidden} identifier={id} sharesBackground={!separateBackground}>
      {children}
    </native_1.RouterToolbarItem>);
};
exports.ToolbarView = ToolbarView;
const ToolbarHost = (props) => {
    // TODO: Replace InternalLinkPreviewContext with a more generic context
    return (<InternalLinkPreviewContext_1.InternalLinkPreviewContext value={{ isVisible: false, href: '' }}>
      <native_1.RouterToolbarHost {...props}/>
    </InternalLinkPreviewContext_1.InternalLinkPreviewContext>);
};
exports.ToolbarHost = ToolbarHost;
//# sourceMappingURL=elements.js.map