import * as React from 'react';

import { requireNativeViewManager } from '@unimodules/core';

export default class ExpoNetworkView extends React.Component {
  static NativeView = requireNativeViewManager('ExpoNetworkView');

  render() {
    return (
      <ExpoNetworkView.NativeView />
    );
  }
}
