import PropTypes from 'prop-types';
import * as React from 'react';
import { View, ViewPropTypes } from 'react-native';
import getBackgroundColor from './getBackgroundColor';
let BlurView = /** @class */ (() => {
    class BlurView extends React.Component {
        render() {
            const { tint, intensity, ...props } = this.props;
            const backgroundColor = getBackgroundColor(intensity, tint);
            return React.createElement(View, Object.assign({}, props, { style: [this.props.style, { backgroundColor }] }));
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
    return BlurView;
})();
export default BlurView;
//# sourceMappingURL=BlurView.android.js.map