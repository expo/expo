import * as React from 'react';
import { View } from 'react-native';
import getBackgroundColor from './getBackgroundColor';
class BlurView extends React.Component {
    render() {
        const { tint = 'default', intensity = 50, style, ...props } = this.props;
        const blurStyle = getBlurStyle({ tint, intensity });
        return React.createElement(View, Object.assign({}, props, { style: [style, blurStyle] }));
    }
}
function isBlurSupported() {
    // https://developer.mozilla.org/en-US/docs/Web/API/CSS/supports
    // https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter#Browser_compatibility
    return (typeof CSS !== 'undefined' &&
        (CSS.supports('-webkit-backdrop-filter', 'blur(1px)') ||
            CSS.supports('backdrop-filter', 'blur(1px)')));
}
function getBlurStyle({ intensity, tint }) {
    const style = {
        backgroundColor: getBackgroundColor(intensity, tint),
    };
    if (isBlurSupported()) {
        style.backdropFilter = `saturate(180%) blur(${intensity * 0.2}px)`;
    }
    return style;
}
export default BlurView;
//# sourceMappingURL=BlurView.web.js.map