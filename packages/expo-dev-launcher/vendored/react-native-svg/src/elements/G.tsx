import React from 'react';
import extractProps, { propsAndStyles } from '../lib/extract/extractProps';
import { extractFont } from '../lib/extract/extractText';
import extractTransform from '../lib/extract/extractTransform';
import { TransformProps } from '../lib/extract/types';
import Shape from './Shape';
import { RNSVGGroup } from './NativeComponents';

export default class G<P> extends Shape<P> {
  static displayName = 'G';

  setNativeProps = (
    props: Object & {
      matrix?: number[];
    } & TransformProps,
  ) => {
    const matrix = !props.matrix && extractTransform(props);
    if (matrix) {
      props.matrix = matrix;
    }
    this.root && this.root.setNativeProps(props);
  };

  render() {
    const { props } = this;
    const prop = propsAndStyles(props);
    const extractedProps = extractProps(prop, this);
    const font = extractFont(prop);
    if (hasProps(font)) {
      extractedProps.font = font;
    }
    return (
      <RNSVGGroup ref={this.refMethod} {...extractedProps}>
        {props.children}
      </RNSVGGroup>
    );
  }
}

const hasProps = (obj: {}) => {
  for (let _ in obj) {
    return true;
  }
  return false;
};
