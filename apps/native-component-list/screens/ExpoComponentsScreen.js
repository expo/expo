import React from 'react';

import ComponentListScreen from './ComponentListScreen';
import { Layout } from '../constants';

export default class ExpoComponentsScreen extends React.Component {
  static navigationOptions = {
    title: Layout.isSmallDevice ? 'Expo SDK Components' : 'Components in Expo SDK',
  };

  render() {
    return <ComponentListScreen apis={this._getApis()} tabName="ExpoComponents" />;
  }

  _getApis = () => {
    return [
      'AdMob',
      'BarCodeScanner',
      'BlurView',
      'FacebookAds',
      'GestureHandlerList',
      'GestureHandlerPinch',
      'GestureHandlerSwipeable',
      'ImagePreview',
      'Gif',
      'GL',
      'LinearGradient',
      'Lottie',
      'Maps',
      'Screens',
      'SVG',
      'Video',
    ];
  };
}
