import React from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  colors: number[];
  locations?: number[] | null;
  startPoint?: Point | null;
  endPoint?: Point | null;
  onLayout?: Function;
} & React.ComponentProps<typeof View>;

type State = {
  width?: number;
  height?: number;
};

type Point = [number, number];

export default class NativeLinearGradient extends React.PureComponent<Props, State> {
  state = {
    width: undefined,
    height: undefined,
  };

  onLayout = event => {
    this.setState({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    });
    if (this.props.onLayout) {
      this.props.onLayout(event);
    }
  };

  getAngle(): string {
    const startPoint = this.props.startPoint ? this.props.startPoint : [0.5, 0.0];
    const endPoint = this.props.endPoint ? this.props.endPoint : [0.5, 1.0];
    const { width = 0, height = 0 } = this.state;
    let angle = 0;

    const gradientWidth = height * (endPoint[0] - startPoint[0]);
    const gradientHeight = width * (endPoint[1] - startPoint[1]);
    angle = Math.atan2(gradientHeight, gradientWidth) + Math.PI / 2;

    return `${angle}rad`;
  }

  getColors(): string {
    const { colors } = this.props;
    return colors
      .map((color, index) => {
        const colorStr = `${color.toString(16)}`;
        const hex = `#${colorStr.substring(2, colorStr.length)}`;

        const location = this.props.locations && this.props.locations[index];
        if (location) {
          return `${hex} ${location * 100}%`;
        }
        return hex;
      })
      .join(',');
  }

  getBackgroundImage(): string | null {
    if (this.state.width && this.state.height) {
      return `linear-gradient(${this.getAngle()},${this.getColors()})`;
    } else {
      return 'transparent';
    }
  }

  render() {
    const { colors, locations, startPoint, endPoint, onLayout, style, ...props } = this.props;
    let flatStyle = StyleSheet.flatten(style) || {};

    // @ts-ignore: [ts] Property 'backgroundImage' does not exist on type 'ViewStyle'.
    flatStyle.backgroundImage = this.getBackgroundImage();

    // TODO: Bacon: In the future we could consider adding `backgroundRepeat: "no-repeat"`. For more browser support.
    return <View style={flatStyle} onLayout={this.onLayout} {...props} />;
  }
}
