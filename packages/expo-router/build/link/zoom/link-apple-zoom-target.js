"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkAppleZoomTarget = LinkAppleZoomTarget;
const react_1 = require("react");
const zoom_transition_context_1 = require("./zoom-transition-context");
const native_1 = require("../preview/native");
/**
 * Defines the target for an Apple zoom transition.
 *
 * @example
 * ```tsx
 * import { Link } from 'expo-router';
 *
 * export default function Screen() {
 *  return (
 *   <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
 *    <Link.AppleZoomTarget>
 *      <Image source={require('../assets/image.png')} style={{ width: 200, height: 200 }} />
 *    </Link.AppleZoomTarget>
 *   </View>
 *  );
 * }
 * ```
 *
 * @platform ios 18+
 */
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