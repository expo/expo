import * as React from 'react';

import { requireNativeViewManager } from 'expo-core';

export default class ExpoAmplitudeView extends React.Component {
  static NativeView = requireNativeViewManager('ExpoAmplitudeView');

  render() {
    return (
      <ExpoAmplitudeView.NativeView />
    );
  }
}
