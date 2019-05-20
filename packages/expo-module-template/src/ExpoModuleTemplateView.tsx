import * as React from 'react';

import { requireNativeViewManager } from '@unimodules/core';

export default class ExpoModuleTemplateView extends React.Component {
  static NativeView = requireNativeViewManager('ExpoModuleTemplateView');

  render() {
    return (
      <ExpoModuleTemplateView.NativeView />
    );
  }
}
