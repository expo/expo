import PropTypes from 'prop-types';
import * as React from 'react';
import { View, ViewPropTypes } from 'react-native';
import getBackgroundColor from './getBackgroundColor';
export default class BlurView extends React.Component {
    render() {
        let { tint, intensity, ...props } = this.props;
        let backgroundColor = getBackgroundColor(intensity, tint);
        return <View {...props} style={[this.props.style, { backgroundColor }]}/>;
    }
}
BlurView.propTypes = {
    ...ViewPropTypes,
    tint: PropTypes.oneOf(['light', 'default', 'dark']).isRequired,
    intensity: PropTypes.number.isRequired,
};
BlurView.defaultProps = {
    tint: 'default',
    intensity: 100,
};
//# sourceMappingURL=BlurView.android.js.map