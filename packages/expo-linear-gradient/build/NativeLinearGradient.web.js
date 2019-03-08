import React from 'react';
import { StyleSheet, View } from 'react-native';
export default class NativeLinearGradient extends React.PureComponent {
    constructor() {
        super(...arguments);
        this.state = {
            width: undefined,
            height: undefined,
        };
        this.onLayout = event => {
            this.setState({
                width: event.nativeEvent.layout.width,
                height: event.nativeEvent.layout.height,
            });
            if (this.props.onLayout) {
                this.props.onLayout(event);
            }
        };
    }
    getAngle() {
        const startPoint = this.props.startPoint ? this.props.startPoint : [0.5, 0.0];
        const endPoint = this.props.endPoint ? this.props.endPoint : [0.5, 1.0];
        const { width = 0, height = 0 } = this.state;
        let angle = 0;
        const gradientWidth = height * (endPoint[0] - startPoint[0]);
        const gradientHeight = width * (endPoint[1] - startPoint[1]);
        angle = Math.atan2(gradientHeight, gradientWidth) + Math.PI / 2;
        return `${angle}rad`;
    }
    getColors() {
        const { colors } = this.props;
        return colors
            .map((color, index) => {
            const location = this.props.locations && this.props.locations[index];
            const hexColor = hexStringFromProcessedColor(color);
            if (location) {
                return `${hexColor} ${location * 100}%`;
            }
            return hexColor;
        })
            .join(',');
    }
    getBackgroundImage() {
        if (this.state.width && this.state.height) {
            return `linear-gradient(${this.getAngle()},${this.getColors()})`;
        }
        else {
            return 'transparent';
        }
    }
    render() {
        const { colors, locations, startPoint, endPoint, onLayout, style, ...props } = this.props;
        let compiledStyle = StyleSheet.flatten(style) || {};
        const flatStyle = {
            ...compiledStyle,
            // @ts-ignore: [ts] Property 'backgroundImage' does not exist on type 'ViewStyle'.
            backgroundImage: this.getBackgroundImage(),
        };
        // TODO: Bacon: In the future we could consider adding `backgroundRepeat: "no-repeat"`. For more browser support.
        return <View style={flatStyle} onLayout={this.onLayout} {...props}/>;
    }
}
function hexStringFromProcessedColor(argbColor) {
    const hexColorString = argbColor.toString(16);
    const withoutAlpha = hexColorString.substring(2);
    const alpha = hexColorString.substring(0, 2);
    return `#${withoutAlpha}${alpha}`;
}
//# sourceMappingURL=NativeLinearGradient.web.js.map