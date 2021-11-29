import React, { Component } from 'react';
import { RNSVGDefs } from './NativeComponents';

export default class Defs extends Component {
  static displayName = 'Defs';

  render() {
    return <RNSVGDefs>{this.props.children}</RNSVGDefs>;
  }
}
