"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeToolbarView = exports.NativeToolbarSearchBarSlot = exports.NativeToolbarSpacer = exports.NativeToolbarButton = exports.NativeToolbarMenuAction = exports.NativeToolbarMenu = void 0;
const react_1 = require("react");
const react_native_1 = require("react-native");
const elements_1 = require("../../../link/elements");
const native_1 = require("../../../link/preview/native");
const native_2 = require("../../../toolbar/native");
/**
 * Native toolbar menu component for bottom toolbar.
 * Renders as NativeLinkPreviewAction.
 */
const NativeToolbarMenu = ({ accessibilityHint, accessibilityLabel, separateBackground, hidesSharedBackground, palette, inline, hidden, subtitle, title, label, destructive, children, icon, image, imageRenderingMode, tintColor, variant, style, elementSize, }) => {
    const identifier = (0, react_1.useId)();
    const titleStyle = react_native_1.StyleSheet.flatten(style);
    const renderingMode = imageRenderingMode ?? (tintColor !== undefined ? 'template' : 'original');
    return (<native_1.NativeLinkPreviewAction sharesBackground={!separateBackground} hidesSharedBackground={hidesSharedBackground} hidden={hidden} icon={icon} 
    // TODO(@ubax): Handle image loading using useImage in a follow-up PR.
    image={image} imageRenderingMode={renderingMode} destructive={destructive} subtitle={subtitle} accessibilityLabel={accessibilityLabel} accessibilityHint={accessibilityHint} displayAsPalette={palette} displayInline={inline} preferredElementSize={elementSize} tintColor={tintColor} titleStyle={titleStyle} barButtonItemStyle={variant === 'done' ? 'prominent' : variant} title={title ?? ''} label={label} onSelected={() => { }} children={children} identifier={identifier}/>);
};
exports.NativeToolbarMenu = NativeToolbarMenu;
// #endregion
// #region NativeToolbarMenuAction
/**
 * Native toolbar menu action - reuses LinkMenuAction.
 */
exports.NativeToolbarMenuAction = elements_1.LinkMenuAction;
/**
 * Native toolbar button component for bottom toolbar.
 * Renders as RouterToolbarItem.
 */
const NativeToolbarButton = (props) => {
    const id = (0, react_1.useId)();
    const renderingMode = props.imageRenderingMode ?? (props.tintColor !== undefined ? 'template' : 'original');
    return (<native_2.RouterToolbarItem accessibilityHint={props.accessibilityHint} accessibilityLabel={props.accessibilityLabel} barButtonItemStyle={props.variant === 'done' ? 'prominent' : props.variant} disabled={props.disabled} hidden={props.hidden} hidesSharedBackground={props.hidesSharedBackground} identifier={id} image={props.image} imageRenderingMode={renderingMode} onSelected={props.onPress} possibleTitles={props.possibleTitles} selected={props.selected} sharesBackground={!props.separateBackground} systemImageName={props.icon} title={props.label} tintColor={props.tintColor} titleStyle={react_native_1.StyleSheet.flatten(props.style)}/>);
};
exports.NativeToolbarButton = NativeToolbarButton;
/**
 * Native toolbar spacer component for bottom toolbar.
 * Renders as RouterToolbarItem with type 'fixedSpacer' or 'fluidSpacer'.
 */
const NativeToolbarSpacer = (props) => {
    const id = (0, react_1.useId)();
    return (<native_2.RouterToolbarItem hidesSharedBackground={props.hidesSharedBackground} hidden={props.hidden} identifier={id} sharesBackground={props.sharesBackground} type={props.width ? 'fixedSpacer' : 'fluidSpacer'} width={props.width}/>);
};
exports.NativeToolbarSpacer = NativeToolbarSpacer;
/**
 * Native toolbar search bar slot for bottom toolbar (iOS 26+).
 * Renders as RouterToolbarItem with type 'searchBar'.
 */
const NativeToolbarSearchBarSlot = ({ hidesSharedBackground, hidden, separateBackground, }) => {
    const id = (0, react_1.useId)();
    if (process.env.EXPO_OS !== 'ios' || parseInt(String(react_native_1.Platform.Version).split('.')[0], 10) < 26) {
        return null;
    }
    if (hidden) {
        return null;
    }
    return (<native_2.RouterToolbarItem hidesSharedBackground={hidesSharedBackground} identifier={id} sharesBackground={!separateBackground} type="searchBar"/>);
};
exports.NativeToolbarSearchBarSlot = NativeToolbarSearchBarSlot;
/**
 * Native toolbar view component for bottom toolbar.
 * Renders as RouterToolbarItem with children.
 */
const NativeToolbarView = ({ children, hidden, hidesSharedBackground, separateBackground, }) => {
    const id = (0, react_1.useId)();
    return (<native_2.RouterToolbarItem hidesSharedBackground={hidesSharedBackground} hidden={hidden} identifier={id} sharesBackground={!separateBackground}>
      {children}
    </native_2.RouterToolbarItem>);
};
exports.NativeToolbarView = NativeToolbarView;
// #endregion
//# sourceMappingURL=bottom-toolbar-native-elements.js.map