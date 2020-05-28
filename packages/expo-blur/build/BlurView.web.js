import PropTypes from 'prop-types';
import * as React from 'react';
import { View, ViewPropTypes } from 'react-native';
import getBackgroundColor from './getBackgroundColor';
let BlurView = /** @class */ (() => {
    class BlurView extends React.Component {
        render() {
            const { tint, intensity, style = {}, ...props } = this.props;
            const blurStyle = getBlurStyle({ tint, intensity });
            return React.createElement(View, Object.assign({}, props, { style: [style, blurStyle] }));
        }
    }
    BlurView.propTypes = {
        tint: PropTypes.oneOf(['light', 'default', 'dark']),
        ...ViewPropTypes,
    };
    BlurView.defaultProps = {
        tint: 'default',
        intensity: 50,
    };
    return BlurView;
})();
export default BlurView;
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
//# sourceMappingURL=BlurView.web.js.map