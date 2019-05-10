import * as React from 'react';

import { requireNativeViewManager } from '@unimodules/core';

export default class ExpoInAppPurchasesView extends React.Component {
  static NativeView = requireNativeViewManager('ExpoInAppPurchasesView');

  render() {
    return (
      <ExpoInAppPurchasesView.NativeView />
    );
  }
}
