// @flow

import { PureComponent, Children } from 'react';

export default class PureContainer extends PureComponent<*> {
  render() {
    return Children.only(this.props.children);
  }
}
