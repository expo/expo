import * as React from 'react';

import { requireNativeViewManager } from 'expo-core';

export default class ExpoModuleTemplateView extends React.Component {
  static NativeView = requireNativeViewManager('ExpoModuleTemplateView', ExpoModuleTemplateView);

  render() {
    return (
      <ExpoModuleTemplateView.NativeView />
    );
  }
}
