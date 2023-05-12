import * as React from 'react';
import { View } from 'react-native';
import getBackgroundColor from './getBackgroundColor';
import getReanimatedIfAvailable from './getReanimatedIfAvailable';
import isSharedValue from './isSharedValue';
const Reanimated = getReanimatedIfAvailable();
export function FnBlurView({ tint = 'default', intensity = 50, style, ...props }) {
    const blurStyle = getBlurStyle({ tint, intensity });
    const animatedStyle = Reanimated &&
        isSharedValue(intensity) &&
        // Presence of this hook will not change at runtime
        // eslint-disable-next-line react-hooks/rules-of-hooks
        Reanimated.useAnimatedStyle(() => getBlurStyle({ intensity, tint }));
    if (Reanimated && isSharedValue(intensity)) {
        return React.createElement(Reanimated.default.View, { ...props, style: [style, blurStyle, animatedStyle] });
    }
    return React.createElement(View, { ...props, style: [style, blurStyle] });
}
// Function component if required by reanimated and class-based component is required by React Animated
// Wrapping function component with class-based component fixes the conflict
export default class BlurView extends React.Component {
    render() {
        return React.createElement(FnBlurView, { ...this.props });
    }
}
function isBlurSupported() {
    // https://developer.mozilla.org/en-US/docs/Web/API/CSS/supports
    // https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter#Browser_compatibility
    return (typeof CSS !== 'undefined' &&
        (CSS.supports('-webkit-backdrop-filter', 'blur(1px)') ||
            CSS.supports('backdrop-filter', 'blur(1px)')));
}
function getBlurStyle({ intensity, tint, }) {
    let intensityValue = isSharedValue(intensity) ? intensity.value : intensity;
    intensityValue = Math.min(intensityValue, 100);
    const style = {
        backgroundColor: getBackgroundColor(intensityValue, tint),
    };
    if (isBlurSupported()) {
        const blur = `saturate(180%) blur(${intensityValue * 0.2}px)`;
        style.backdropFilter = blur;
        // Safari support
        style.WebkitBackdropFilter = blur;
    }
    return style;
}
//# sourceMappingURL=BlurView.web.js.map