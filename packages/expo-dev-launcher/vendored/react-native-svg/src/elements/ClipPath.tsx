import React from 'react';
import { extract } from '../lib/extract/extractProps';
import Shape from './Shape';
import { RNSVGClipPath } from './NativeComponents';

export default class ClipPath extends Shape<{}> {
  static displayName = 'ClipPath';

  render() {
    const { props } = this;
    return (
      <RNSVGClipPath ref={this.refMethod} {...extract(this, props)}>
        {props.children}
      </RNSVGClipPath>
    );
  }
}
