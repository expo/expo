// Copyright © 2024 650 Industries.
'use client';
import { requireNativeViewManager } from 'expo-modules-core';
const NativeGlassView = requireNativeViewManager('ExpoGlassEffect', 'GlassView');
function normalizeGlassEffectStyle(style) {
    if (typeof style === 'string') {
        return { style, animate: false };
    }
    return style ?? { style: 'regular', animate: false };
}
const GlassView = ({ glassEffectStyle, ...props }) => {
    const normalizedStyle = normalizeGlassEffectStyle(glassEffectStyle);
    return <NativeGlassView glassEffectStyle={normalizedStyle} {...props}/>;
};
export default GlassView;
//# sourceMappingURL=GlassView.ios.js.map