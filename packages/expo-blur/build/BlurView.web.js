import PropTypes from 'prop-types';
import * as React from 'react';
import { StyleSheet, View, ViewPropTypes } from 'react-native';
import getBackgroundColor from './getBackgroundColor';
function isBlurSupported() {
    // https://developer.mozilla.org/en-US/docs/Web/API/CSS/supports
    // https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter#Browser_compatibility
    // TODO: Bacon: Chrome blur seems broken natively
    return (CSS.supports('-webkit-backdrop-filter', 'blur(1px)') ||
        CSS.supports('backdrop-filter', 'blur(1px)'));
}
function getBlurStyle({ intensity, tint }) {
    if (isBlurSupported()) {
        let filter = `blur(${intensity}px)`;
        if (tint === 'dark') {
            filter += ' brightness(50%)';
        }
        else if (tint === 'light') {
            filter += ' brightness(150%)';
        }
        return {
            // @ts-ignore
            'backdrop-filter': filter,
            '-webkit-backdrop-filter': filter,
        };
    }
    else {
        let backgroundColor = getBackgroundColor(intensity, tint);
        return { backgroundColor };
    }
}
export default class BlurView extends React.Component {
    constructor() {
        super(...arguments);
        this.getBlurStyle = () => {
            const { tint, intensity } = this.props;
            if (isBlurSupported()) {
                let filter = `blur(${intensity}px)`;
                if (tint === 'dark') {
                    filter += ' brightness(50%)';
                }
                else if (tint === 'light') {
                    filter += ' brightness(150%)';
                }
                return {
                    // @ts-ignore
                    'backdrop-filter': filter,
                    '-webkit-backdrop-filter': filter,
                };
            }
            else {
                let backgroundColor = getBackgroundColor(intensity, tint);
                return { backgroundColor };
            }
        };
    }
    render() {
        let { tint, intensity, style = {}, ...props } = this.props;
        const blurStyle = getBlurStyle({ tint, intensity });
        return <View {...props} style={StyleSheet.flatten([style, blurStyle])}/>;
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
//# sourceMappingURL=BlurView.web.js.map