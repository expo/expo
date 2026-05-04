// Copyright © 2024 650 Industries.
'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { requireNativeViewManager } from 'expo-modules-core';
const NativeGlassView = requireNativeViewManager('ExpoGlassEffect', 'GlassView');
const GlassView = (props) => {
    return _jsx(NativeGlassView, { ...props });
};
export default GlassView;
//# sourceMappingURL=GlassView.ios.js.map