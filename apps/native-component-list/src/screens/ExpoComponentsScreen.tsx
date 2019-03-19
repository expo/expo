import React from 'react';
import ComponentListScreen from './ComponentListScreen';
import { Layout } from '../constants';
import { Screens } from '../navigation/ExpoComponents';

export default class ExpoComponentsScreen extends React.Component {
  static path = '';

  static navigationOptions = {
    title: Layout.isSmallDevice ? 'Expo SDK Components' : 'Components in Expo SDK',
  };

  render() {
    return <ComponentListScreen apis={this._getApis()} tabName="ExpoComponents" />;
  }

  _getApis = () => {
    const screens = [
      'AdMob',
      'BarCodeScanner',
      'BlurView',
      'Camera',
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
      'WebView',
    ];
    return screens
      .map(name => ({ name, isAvailable: !!Screens[name] }))
      .sort((a, b) => {
        if (a.isAvailable !== b.isAvailable) {
          if (a.isAvailable) {
            return -1;
          }
          return 1;
        }
        return 0;
      });
  };
}
