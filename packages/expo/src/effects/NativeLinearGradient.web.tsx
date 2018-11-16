import React from 'react';
import { View } from 'react-native';

type Props = {
  colors: number[];
  locations?: number[] | null;
  startPoint?: Point | null;
  endPoint?: Point | null;
  onLayout?: Function;
} & React.ElementProps<View>;

type State = {
  width: number;
  height: number;
};
type Point = [number, number];

export default class NativeLinearGradient extends React.PureComponent<Props, State> {
  state = {
    width: 0.5,
    height: 0.5,
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

  get angle(): string {
    const startPoint = this.props.startPoint ? this.props.startPoint : [0, 0];
    const endPoint = this.props.endPoint ? this.props.endPoint : [1, 1];
    const { width, height } = this.state;
    const x = height * (endPoint[0] - startPoint[0]);
    const y = width * (endPoint[1] - startPoint[1]);
    const angle = Math.atan2(y, x) + Math.PI / 2;
    return `${angle}rad`;
  }

  get colors(): string {
    return this.props.colors
      .map((color, index) => {
        const location = this.props.locations && this.props.locations[index];
        if (location) {
          return `${color} ${location * 100}%`;
        }
        return color;
      })
      .join(',');
  }

  get backgroundImage(): string {
    return `linear-gradient(${this.angle},${this.colors})`;
  }

  render() {
    const { colors, locations, startPoint, endPoint, onLayout, style, ...props } = this.props;
    const { backgroundImage } = this;
    let viewStyle = style || {};
    viewStyle['backgroundImage'] = backgroundImage;
    return <View style={viewStyle} onLayout={this.onLayout} {...props} />;
  }
}
