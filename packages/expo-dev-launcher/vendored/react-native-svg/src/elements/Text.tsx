import React, { Component } from 'react';
import extractText from '../lib/extract/extractText';
import extractProps, { propsAndStyles } from '../lib/extract/extractProps';
import extractTransform from '../lib/extract/extractTransform';
import { TransformProps } from '../lib/extract/types';
import { pickNotNil } from '../lib/util';
import Shape from './Shape';
import './TSpan';
import { RNSVGText } from './NativeComponents';

export default class Text extends Shape<{}> {
  static displayName = 'Text';

  setNativeProps = (
    props: Object & {
      matrix?: number[];
      style?: [] | {};
    } & TransformProps,
  ) => {
    const matrix = props && !props.matrix && extractTransform(props);
    if (matrix) {
      props.matrix = matrix;
    }
    const prop = propsAndStyles(props);
    Object.assign(prop, pickNotNil(extractText(prop, true)));
    this.root && this.root.setNativeProps(prop);
  };

  render() {
    const prop = propsAndStyles(this.props);
    const props = extractProps(
      {
        ...prop,
        x: null,
        y: null,
      },
      this,
    );
    Object.assign(props, extractText(prop, true));
    props.ref = this.refMethod as (instance: Component | null) => void;
    return <RNSVGText {...props} />;
  }
}
