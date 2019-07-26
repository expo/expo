import * as React from 'react';

import { requireNativeViewManager } from '@unimodules/core';

export default class ExpoCellularView extends React.Component {
  static NativeView = requireNativeViewManager('ExpoCellularView');

  render() {
    return (
      <ExpoCellularView.NativeView />
    );
  }
}
