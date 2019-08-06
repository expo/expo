import * as React from 'react';

import { requireNativeViewManager } from '@unimodules/core';

export default class ExpoOtaView extends React.Component {
  static NativeView = requireNativeViewManager('ExpoOtaView');

  render() {
    return (
      <ExpoOtaView.NativeView />
    );
  }
}
