import PropTypes from 'prop-types';
import * as React from 'react';
import { View, ViewPropTypes } from 'react-native';
export default class BlurView extends React.Component {
    render() {
        let { tint, ...props } = this.props;
        let backgroundColor;
        if (tint === 'dark') {
            backgroundColor = 'rgba(0,0,0,0.5)';
        }
        else if (tint === 'light') {
            backgroundColor = 'rgba(255,255,255,0.7)';
        }
        else {
            backgroundColor = 'rgba(255,255,255,0.4)';
        }
        return <View {...props} style={[this.props.style, { backgroundColor }]}/>;
    }
}
BlurView.propTypes = {
    tint: PropTypes.oneOf(['light', 'default', 'dark']),
    ...ViewPropTypes,
};
//# sourceMappingURL=BlurView.android.js.map