import PropTypes from 'prop-types';
import * as React from 'react';
import { View, ViewPropTypes } from 'react-native';
import getBackgroundColor from './getBackgroundColor';
export default class BlurView extends React.Component {
    render() {
        let { tint, intensity, style = {}, ...props } = this.props;
        const blurStyle = getBlurStyle({ tint, intensity });
        return <View {...props} style={[style, blurStyle]}/>;
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
function isBlurSupported() {
    // https://developer.mozilla.org/en-US/docs/Web/API/CSS/supports
    // https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter#Browser_compatibility
    // TODO: Bacon: Chrome blur seems broken natively
    return typeof CSS !== 'undefined' && CSS.supports('-webkit-backdrop-filter', 'blur(1px)');
    // TODO: Bacon: Chrome doesn't work, RNWeb uses webkit on Safari, which works.
    // || CSS.supports('backdrop-filter', 'blur(1px)')
}
function getBlurStyle({ intensity, tint }) {
    if (isBlurSupported()) {
        let backdropFilter = `blur(${intensity * 0.25}px)`;
        if (tint === 'dark') {
            backdropFilter += ' brightness(50%)';
        }
        else if (tint === 'light') {
            backdropFilter += ' brightness(150%)';
        }
        return {
            backdropFilter,
        };
    }
    else {
        let backgroundColor = getBackgroundColor(intensity, tint);
        return { backgroundColor };
    }
}
//# sourceMappingURL=BlurView.web.js.map