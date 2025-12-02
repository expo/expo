"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkAppleZoom = LinkAppleZoom;
const react_1 = require("react");
const ZoomTransitionEnabler_ios_1 = require("../ZoomTransitionEnabler.ios");
const zoom_transition_context_1 = require("./zoom-transition-context");
const native_1 = require("../preview/native");
function LinkAppleZoom({ children, alignmentRect }) {
    if (!(0, ZoomTransitionEnabler_ios_1.isZoomTransitionEnabled)()) {
        return children;
    }
    const value = (0, react_1.use)(zoom_transition_context_1.ZoomTransitionSourceContext);
    if (!value) {
        throw new Error('[expo-router] Link.ZoomTransitionSource must be used within a Link component with unstable_transition="zoom" and unstable_customTransitionSource={true}.');
    }
    const { identifier } = value;
    console.log('Link.ZoomTransitionSourceWrapper rendering with identifier:', identifier);
    if (react_1.Children.count(children) > 1) {
        console.warn('[expo-router] Link.ZoomTransitionSource only accepts a single child component. Please wrap multiple children in a View or another container component.');
        return null;
    }
    return (<native_1.LinkZoomTransitionSource identifier={identifier} alignment={alignmentRect}>
      {children}
    </native_1.LinkZoomTransitionSource>);
}
//# sourceMappingURL=link-apple-zoom.js.map