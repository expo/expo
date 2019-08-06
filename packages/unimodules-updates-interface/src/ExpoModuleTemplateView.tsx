import * as React from 'react';

import { requireNativeViewManager } from '@unimodules/core';

export default class UnimodulesUpdatesInterfaceView extends React.Component {
  static NativeView = requireNativeViewManager('UnimodulesUpdatesInterfaceView');

  render() {
    return (
      <UnimodulesUpdatesInterfaceView.NativeView />
    );
  }
}
