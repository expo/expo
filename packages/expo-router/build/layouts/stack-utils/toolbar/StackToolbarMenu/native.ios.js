"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeToolbarMenuAction = exports.NativeToolbarMenu = void 0;
const react_1 = require("react");
const react_native_1 = require("react-native");
const elements_1 = require("../../../../link/elements");
const native_1 = require("../../../../link/preview/native");
/**
 * Native toolbar menu component for bottom toolbar.
 * Renders as NativeLinkPreviewAction.
 */
const NativeToolbarMenu = ({ accessibilityHint, accessibilityLabel, separateBackground, hidesSharedBackground, palette, inline, hidden, subtitle, title, label, destructive, children, icon, xcassetName, image, imageRenderingMode, tintColor, variant, style, elementSize, }) => {
    const identifier = (0, react_1.useId)();
    const titleStyle = react_native_1.StyleSheet.flatten(style);
    const renderingMode = imageRenderingMode ?? (tintColor !== undefined ? 'template' : 'original');
    return (<native_1.NativeLinkPreviewAction sharesBackground={!separateBackground} hidesSharedBackground={hidesSharedBackground} hidden={hidden} icon={icon} xcassetName={xcassetName} 
    // TODO(@ubax): Handle image loading using useImage in a follow-up PR.
    image={image} imageRenderingMode={renderingMode} destructive={destructive} subtitle={subtitle} accessibilityLabel={accessibilityLabel} accessibilityHint={accessibilityHint} displayAsPalette={palette} displayInline={inline} preferredElementSize={elementSize} tintColor={tintColor} titleStyle={titleStyle} barButtonItemStyle={variant === 'done' ? 'prominent' : variant} title={title ?? ''} label={label} onSelected={() => { }} children={children} identifier={identifier}/>);
};
exports.NativeToolbarMenu = NativeToolbarMenu;
/**
 * Native toolbar menu action - reuses LinkMenuAction.
 */
exports.NativeToolbarMenuAction = elements_1.LinkMenuAction;
//# sourceMappingURL=native.ios.js.map