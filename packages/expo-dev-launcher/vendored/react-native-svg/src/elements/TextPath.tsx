import React, { Component } from 'react';
import extractTransform from '../lib/extract/extractTransform';
import { withoutXY } from '../lib/extract/extractProps';
import { NumberProp, TransformProps } from '../lib/extract/types';
import extractText from '../lib/extract/extractText';
import { idPattern, pickNotNil } from '../lib/util';
import Shape from './Shape';
import TSpan from './TSpan';
import { RNSVGTextPath } from './NativeComponents';

export default class TextPath extends Shape<{
  children?: NumberProp | [NumberProp | React.ComponentType];
  alignmentBaseline?: string;
  startOffset?: NumberProp;
  xlinkHref?: string;
  midLine?: string;
  spacing?: string;
  method?: string;
  href?: string;
  side?: string;
}> {
  static displayName = 'TextPath';

  setNativeProps = (
    props: Object & {
      matrix?: number[];
      style?: [] | {};
    } & TransformProps,
  ) => {
    const matrix = !props.matrix && extractTransform(props);
    if (matrix) {
      props.matrix = matrix;
    }
    Object.assign(props, pickNotNil(extractText(props, true)));
    this.root && this.root.setNativeProps(props);
  };

  render() {
    const {
      children,
      xlinkHref,
      href = xlinkHref,
      startOffset = 0,
      method,
      spacing,
      side,
      alignmentBaseline,
      midLine,
      ...prop
    } = this.props;
    const matched = href && href.match(idPattern);
    const match = matched && matched[1];
    if (match) {
      const props = withoutXY(this, prop);
      Object.assign(
        props,
        extractText(
          {
            children,
          },
          true,
        ),
        {
          href: match,
          startOffset,
          method,
          spacing,
          side,
          alignmentBaseline,
          midLine,
        },
      );
      props.ref = this.refMethod as (instance: Component | null) => void;
      return <RNSVGTextPath {...props} />;
    }

    console.warn(
      'Invalid `href` prop for `TextPath` element, expected a href like "#id", but got: "' +
        href +
        '"',
    );
    return (
      <TSpan ref={this.refMethod as (instance: Component | null) => void}>
        {children}
      </TSpan>
    );
  }
}
