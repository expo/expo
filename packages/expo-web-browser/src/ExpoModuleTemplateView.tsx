import * as React from 'react';

import { requireNativeViewManager } from 'expo-core';

export default class ExpoWebBrowserView extends React.Component {
  static NativeView = requireNativeViewManager('ExpoWebBrowserView');

  render() {
    return (
      <ExpoWebBrowserView.NativeView />
    );
  }
}
