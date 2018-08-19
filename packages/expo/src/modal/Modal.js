// @flow

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { channel } from './ModalHost';
import ModalImplementation from './ModalImplementation';
import type { ModalProps as Props } from './ModalImplementation';

export default class Modal extends Component<Props, void> {
  static contextTypes = {
    [channel]: PropTypes.object,
  };

  componentWillMount() {
    const { register } = this.context[channel];
    this._handle = register((layout, key) => {
      return <ModalImplementation {...this.props} key={key} layout={layout} />;
    });
  }

  componentWillReceiveProps(nextProps: Props) {
    this._handle.update((layout, key) => {
      return <ModalImplementation {...nextProps} key={key} layout={layout} />;
    });
  }

  componentWillUnmount() {
    this._handle.remove();
  }

  _handle: {
    update: Function,
    remove: Function,
  };

  render() {
    return null;
  }
}
