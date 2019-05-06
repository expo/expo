import * as React from 'react';

import { requireNativeViewManager } from '@unimodules/core';

export default class ExpoUpdatesView extends React.Component {
  static NativeView = requireNativeViewManager('ExpoUpdatesView');

  render() {
    return (
      <ExpoUpdatesView.NativeView />
    );
  }
}
