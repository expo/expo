import React from 'react';
import { withoutXY } from '../lib/extract/extractProps';
import { NumberProp } from '../lib/extract/types';
import Shape from './Shape';
import { RNSVGRect } from './NativeComponents';

export default class Rect extends Shape<{
  x?: NumberProp;
  y?: NumberProp;
  width?: NumberProp;
  height?: NumberProp;
  rx?: NumberProp;
  ry?: NumberProp;
}> {
  static displayName = 'Rect';

  static defaultProps = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };

  render() {
    const { props } = this;
    const { x, y, width, height, rx, ry } = props;
    const rectProps = { x, y, width, height, rx, ry };
    return (
      <RNSVGRect
        ref={this.refMethod}
        {...withoutXY(this, props)}
        {...rectProps}
      />
    );
  }
}
