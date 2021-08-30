import * as React from 'react';
import { View } from 'react-native';
import getBackgroundColor from './getBackgroundColor';
class BlurView extends React.Component {
    render() {
        const { tint = 'default', intensity = 100, style, ...props } = this.props;
        const backgroundColor = getBackgroundColor(intensity, tint);
        return React.createElement(View, { ...props, style: [style, { backgroundColor }] });
    }
}
export default BlurView;
//# sourceMappingURL=BlurView.android.js.map