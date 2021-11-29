import React from 'react';
import { extract } from '../lib/extract/extractProps';
import Shape from './Shape';
import { RNSVGPath } from './NativeComponents';

export default class Path extends Shape<{
  d?: string;
}> {
  static displayName = 'Path';

  render() {
    const { props } = this;
    const { d } = props;
    const pathProps = { ...extract(this, props), d };
    return <RNSVGPath ref={this.refMethod} {...pathProps} />;
  }
}
