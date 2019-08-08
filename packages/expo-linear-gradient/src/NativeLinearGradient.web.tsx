import React from 'react';
import { View } from 'react-native';

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

const PI_2 = Math.PI / 2;

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

  getControlPoints = (): Point[] => {
    const { startPoint, endPoint } = this.props;

    let correctedStartPoint: Point = [0, 0];
    if (Array.isArray(startPoint)) {
      correctedStartPoint = [
        startPoint[0] != null ? startPoint[0] : 0.0,
        startPoint[1] != null ? startPoint[1] : 0.0,
      ];
    }
    let correctedEndPoint: Point = [0.0, 1.0];
    if (Array.isArray(endPoint)) {
      correctedEndPoint = [
        endPoint[0] != null ? endPoint[0] : 0.0,
        endPoint[1] != null ? endPoint[1] : 1.0,
      ];
    }
    return [correctedStartPoint, correctedEndPoint];
  };

  calculateGradientAngleFromControlPoints = (): number => {
    const [start, end] = this.getControlPoints();
    const { width = 1, height = 1 } = this.state;
    start[0] *= width;
    end[0] *= width;
    start[1] *= height;
    end[1] *= height;
    const py = end[1] - start[1];
    const px = end[0] - start[0];
    return 90 + (Math.atan2(py, px) * 180) / Math.PI;
  };

  getWebGradientColorStyle = (): string => {
    return this.getGradientValues().join(',');
  };

  convertJSColorToGradientSafeColor = (color: number, index: number): string => {
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

  getGradientValues = (): string[] => {
    return this.props.colors.map(this.convertJSColorToGradientSafeColor);
  };

  getBackgroundImage = (): string => {
    return `linear-gradient(${this.calculateGradientAngleFromControlPoints()}deg, ${this.getWebGradientColorStyle()})`;
  };

  render() {
    const { colors, locations, startPoint, endPoint, onLayout, style, ...props } = this.props;
    const backgroundImage = this.getBackgroundImage();
    // TODO: Bacon: In the future we could consider adding `backgroundRepeat: "no-repeat"`. For more browser support.
    return (
      <View
        style={[
          style,
          // @ts-ignore: [ts] Property 'backgroundImage' does not exist on type 'ViewStyle'.
          { backgroundImage },
        ]}
        onLayout={this.onLayout}
        {...props}
      />
    );
  }
}

function hexStringFromProcessedColor(argbColor: number): string {
  if (argbColor === 0) {
    return `rgba(0,0,0,0)`;
  }
  const hexColorString = argbColor.toString(16);
  const withoutAlpha = hexColorString.substring(2);
  const alpha = hexColorString.substring(0, 2);
  return `#${withoutAlpha}${alpha}`;
}
