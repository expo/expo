import React from 'react';
import Path from './Path';
import Shape from './Shape';
import { NumberProp } from '../lib/extract/types';
import extractPolyPoints from '../lib/extract/extractPolyPoints';

export default class Polygon extends Shape<{ points?: number[] }> {
  static displayName = 'Polygon';

  static defaultProps = {
    points: '',
  };

  setNativeProps = (
    props: Object & {
      points?: string | NumberProp[];
      d?: string;
    },
  ) => {
    const { points } = props;
    if (points) {
      props.d = `M${extractPolyPoints(points)}z`;
    }
    this.root && this.root.setNativeProps(props);
  };

  render() {
    const { props } = this;
    const { points } = props;
    return (
      <Path
        ref={this.refMethod as (instance: Path | null) => void}
        d={points && `M${extractPolyPoints(points)}z`}
        {...props}
      />
    );
  }
}
