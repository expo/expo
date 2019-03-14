import React from 'react';
import { StyleSheet, View } from 'react-native';
const PI_2 = Math.PI / 2;
function radToDeg(radians) {
    return (radians * 180.0) / Math.PI;
}
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
        this.getControlPoints = () => {
            const { startPoint, endPoint } = this.props;
            let correctedStartPoint = [0.5, 0.0];
            if (Array.isArray(startPoint)) {
                correctedStartPoint = [
                    startPoint[0] != null ? startPoint[0] : 0.5,
                    startPoint[1] != null ? startPoint[1] : 0.0,
                ];
            }
            let correctedEndPoint = [0.5, 1.0];
            if (Array.isArray(endPoint)) {
                correctedEndPoint = [
                    endPoint[0] != null ? endPoint[0] : 0.5,
                    endPoint[1] != null ? endPoint[1] : 1.0,
                ];
            }
            return [correctedStartPoint, correctedEndPoint];
        };
        this.calculateGradientAngleFromControlPoints = () => {
            const [start, end] = this.getControlPoints();
            const { width = 0, height = 0 } = this.state;
            const radians = Math.atan2(height * (end[0] - start[0]), width * (end[1] - start[1])) + PI_2;
            const degrees = radToDeg(radians);
            return degrees;
        };
        this.getWebGradientColorStyle = () => {
            return this.getGradientValues().join(',');
        };
        this.convertJSColorToGradientSafeColor = (color, index) => {
            const { locations } = this.props;
            const hexColor = hexStringFromProcessedColor(color);
            let output = hexColor;
            if (locations && locations[index]) {
                const location = Math.max(0, Math.min(1, locations[index]));
                // Convert 0...1 to 0...100
                const percentage = location * 100;
                output += ` ${percentage}%`;
            }
            return output;
        };
        this.getGradientValues = () => {
            return this.props.colors.map(this.convertJSColorToGradientSafeColor);
        };
        this.getBackgroundImage = () => {
            if (this.state.width && this.state.height) {
                return `linear-gradient(${this.calculateGradientAngleFromControlPoints()}deg, ${this.getWebGradientColorStyle()})`;
            }
            return `transparent`;
        };
    }
    render() {
        const { colors, locations, startPoint, endPoint, onLayout, style, ...props } = this.props;
        let flatStyle = style;
        const backgroundImage = this.getBackgroundImage();
        if (backgroundImage) {
            let compiledStyle = StyleSheet.flatten(style) || {};
            flatStyle = {
                ...compiledStyle,
                // @ts-ignore: [ts] Property 'backgroundImage' does not exist on type 'ViewStyle'.
                backgroundImage: this.getBackgroundImage(),
            };
        }
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