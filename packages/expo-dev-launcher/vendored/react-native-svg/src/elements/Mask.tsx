import React from 'react';
import extractTransform from '../lib/extract/extractTransform';
import { withoutXY } from '../lib/extract/extractProps';
import { NumberProp, TransformProps } from '../lib/extract/types';
import units from '../lib/units';
import Shape from './Shape';
import { RNSVGMask } from './NativeComponents';

export default class Mask extends Shape<{
  x?: NumberProp;
  y?: NumberProp;
  width?: NumberProp;
  height?: NumberProp;
  transform?: number[] | string | TransformProps;
  maskTransform?: number[] | string | TransformProps;
  maskUnits?: 'objectBoundingBox' | 'userSpaceOnUse';
  maskContentUnits?: 'objectBoundingBox' | 'userSpaceOnUse';
}> {
  static displayName = 'Mask';

  static defaultProps = {
    x: '0%',
    y: '0%',
    width: '100%',
    height: '100%',
  };

  render() {
    const { props } = this;
    const {
      maskTransform,
      transform,
      x,
      y,
      width,
      height,
      maskUnits,
      maskContentUnits,
      children,
    } = props;
    const maskProps = {
      x,
      y,
      width,
      height,
      maskTransform: extractTransform(maskTransform || transform || props),
      maskUnits: maskUnits !== undefined ? units[maskUnits] : 0,
      maskContentUnits:
        maskContentUnits !== undefined ? units[maskContentUnits] : 1,
    };
    return (
      <RNSVGMask
        ref={this.refMethod}
        {...withoutXY(this, props)}
        {...maskProps}
      >
        {children}
      </RNSVGMask>
    );
  }
}
