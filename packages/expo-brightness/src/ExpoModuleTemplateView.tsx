import * as React from 'react';

import { requireNativeViewManager } from 'expo-core';

export default class ExpoBrightnessView extends React.Component {
  static NativeView = requireNativeViewManager('ExpoBrightnessView');

  render() {
    return (
      <ExpoBrightnessView.NativeView />
    );
  }
}
