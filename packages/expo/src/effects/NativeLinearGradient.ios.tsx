import PropTypes from 'prop-types';
import React from 'react';
import { View, ViewPropTypes, requireNativeComponent } from 'react-native';

type Props = {
  colors: number[];
  locations?: number[] | null;
  startPoint?: Point | null;
  endPoint?: Point | null;
} & React.ElementProps<View>;

type Point = [number, number];

export default class NativeLinearGradient extends React.PureComponent<Props> {
  render() {
    return <BaseNativeLinearGradient {...this.props} />;
  }
}

const BaseNativeLinearGradient = requireNativeComponent('ExponentLinearGradient', {
  propTypes: {
    ...ViewPropTypes,
    colors: PropTypes.arrayOf(PropTypes.number),
    locations: PropTypes.arrayOf(PropTypes.number),
    startPoint: PropTypes.arrayOf(PropTypes.number),
    endPoint: PropTypes.arrayOf(PropTypes.number),
  },
});
