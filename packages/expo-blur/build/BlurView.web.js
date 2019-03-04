import PropTypes from 'prop-types';
import * as React from 'react';
import { View, StyleSheet, ViewPropTypes } from 'react-native';
export default class BlurView extends React.Component {
    render() {
        let { tint, style = {}, ...props } = this.props;
        let backgroundColor = 'rgba(255,255,255,0.4)';
        if (tint === 'dark') {
            backgroundColor = 'rgba(0,0,0,0.5)';
        }
        else if (tint === 'light') {
            backgroundColor = 'rgba(255,255,255,0.7)';
        }
        return <View {...props} style={StyleSheet.flatten([style, { backgroundColor }])}/>;
    }
}
BlurView.propTypes = {
    tint: PropTypes.oneOf(['light', 'default', 'dark']),
    ...ViewPropTypes,
};
//# sourceMappingURL=BlurView.web.js.map