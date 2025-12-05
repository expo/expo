"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkAppleZoomTarget = LinkAppleZoomTarget;
const react_1 = require("react");
const zoom_transition_context_1 = require("./zoom-transition-context");
const native_1 = require("../preview/native");
function LinkAppleZoomTarget({ children }) {
    if (react_1.Children.count(children) > 1) {
        console.warn('[expo-router] Link.AppleZoomTarget only accepts a single child component. Please wrap multiple children in a View or another container component.');
        return null;
    }
    const { identifier } = (0, react_1.use)(zoom_transition_context_1.ZoomTransitionTargetContext);
    if (!identifier) {
        return children;
    }
    return (<native_1.LinkZoomTransitionAlignmentRectDetector identifier={identifier}>
      {children}
    </native_1.LinkZoomTransitionAlignmentRectDetector>);
}
//# sourceMappingURL=link-apple-zoom-target.js.map