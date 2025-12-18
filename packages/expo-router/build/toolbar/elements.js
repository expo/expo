"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolbarHost = exports.ToolbarView = exports.ToolbarSpacer = exports.ToolbarButton = exports.ToolbarMenuAction = exports.ToolbarMenu = void 0;
const non_secure_1 = require("nanoid/non-secure");
const react_1 = require("react");
const react_native_1 = require("react-native");
const native_1 = require("./native");
const InternalLinkPreviewContext_1 = require("../link/InternalLinkPreviewContext");
const elements_1 = require("../link/elements");
/**
 * Adds a context menu for to a toolbar.
 *
 * For available props, see [`LinkMenuProps`](./router/#linkmenuprops).
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
exports.ToolbarMenu = elements_1.LinkMenu;
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
    const id = (0, react_1.useMemo)(() => (0, non_secure_1.nanoid)(), []);
    const sf = typeof props.icon === 'string' ? props.icon : undefined;
    return (<native_1.RouterToolbarItem barButtonItemStyle={props.variant === 'done' ? 'prominent' : props.variant} hidden={props.hidden} hidesSharedBackground={props.hidesSharedBackground} identifier={id} onSelected={props.onPress} possibleTitles={props.possibleTitles} selected={props.selected} sharesBackground={!props.separateBackground} systemImageName={sf} title={String(props.children)} tintColor={props.tintColor}/>);
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
    const id = (0, react_1.useMemo)(() => (0, non_secure_1.nanoid)(), []);
    return (<native_1.RouterToolbarItem hidesSharedBackground={props.hidesSharedBackground} hidden={props.hidden} identifier={id} sharesBackground={props.sharesBackground} type={props.width ? 'fixedSpacer' : 'fluidSpacer'} width={props.width}/>);
};
exports.ToolbarSpacer = ToolbarSpacer;
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
 *   <Toolbar.View style={{ width: 200 }}>
 *     <TextInput
 *       placeholder="Search"
 *       placeholderTextColor={Color.ios.placeholderText}
 *     />
 *   </Toolbar.View>
 *   <Toolbar.View separateBackground style={{ width: 32, height: 32 }}>
 *     <Pressable onPress={handlePress}>
 *       <SymbolView name="plus" size={22} />
 *     </Pressable>
 *   </Toolbar.View>
 * </Toolbar>
 * ```
 *
 * @platform ios
 */
const ToolbarView = ({ children, hidden, hidesSharedBackground, separateBackground, style, }) => {
    const id = (0, react_1.useMemo)(() => (0, non_secure_1.nanoid)(), []);
    return (<native_1.RouterToolbarItem hidesSharedBackground={hidesSharedBackground} hidden={hidden} identifier={id} sharesBackground={!separateBackground}>
      <react_native_1.View style={[style, { position: 'absolute' }]}>{children}</react_native_1.View>
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