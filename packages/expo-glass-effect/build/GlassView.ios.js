// Copyright © 2024 650 Industries.
'use client';
import { requireNativeViewManager } from 'expo-modules-core';
const NativeGlassView = requireNativeViewManager('ExpoGlassEffect', 'GlassView');
const GlassView = (props) => {
    return <NativeGlassView {...props}/>;
};
export default GlassView;
//# sourceMappingURL=GlassView.ios.js.map