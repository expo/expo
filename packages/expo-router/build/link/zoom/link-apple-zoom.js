"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkAppleZoom = LinkAppleZoom;
const react_1 = require("react");
const ZoomTransitionEnabler_1 = require("./ZoomTransitionEnabler");
const zoom_transition_context_1 = require("./zoom-transition-context");
const Slot_1 = require("../../ui/Slot");
const native_1 = require("../preview/native");
/**
 * When this component is used inside a Link, [zoom transition](https://developer.apple.com/documentation/uikit/enhancing-your-app-with-fluid-transitions?language=objc)
 * will be used when navigating to the link's href.
 *
 * @platform ios 18+
 */
function LinkAppleZoom(props) {
    if (!(0, ZoomTransitionEnabler_1.isZoomTransitionEnabled)()) {
        return <Slot_1.Slot {...props}/>;
    }
    return <LinkAppleZoomImpl {...props}/>;
}
function LinkAppleZoomImpl({ children, alignmentRect, ...rest }) {
    const value = (0, react_1.use)(zoom_transition_context_1.ZoomTransitionSourceContext);
    if (!value) {
        throw new Error('[expo-router] Link.ZoomTransitionSource must be used within a Link');
    }
    const { identifier, addSource, removeSource } = value;
    (0, react_1.useEffect)(() => {
        addSource();
        return removeSource;
    }, [addSource, removeSource]);
    const hasTooManyChildren = react_1.Children.count(children) > 1;
    (0, react_1.useEffect)(() => {
        if (process.env.NODE_ENV !== 'production' && hasTooManyChildren) {
            console.warn('[expo-router] Link.ZoomTransitionSource only accepts a single child component. Please wrap multiple children in a View or another container component.');
        }
    }, [hasTooManyChildren]);
    if (hasTooManyChildren) {
        return null;
    }
    return (<native_1.LinkZoomTransitionSource identifier={identifier} alignment={alignmentRect} 
    // Note(@ubax): Even though we always set this to true, I want to keep the prop here for easier future changes.
    animateAspectRatioChange>
      <Slot_1.Slot {...rest}>{children}</Slot_1.Slot>
    </native_1.LinkZoomTransitionSource>);
}
//# sourceMappingURL=link-apple-zoom.js.map