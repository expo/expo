import * as React from 'react';
import { View } from 'react-native';
import getBackgroundColor from './getBackgroundColor';
export default class BlurView extends React.Component {
    render() {
        const { tint = 'default', intensity = 50, style, ...props } = this.props;
        const backgroundColor = getBackgroundColor(intensity, tint);
        return React.createElement(View, { ...props, style: [style, { backgroundColor }] });
    }
}
//# sourceMappingURL=BlurView.android.js.map