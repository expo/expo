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
    // @ts-ignore
    return <ComponentListScreen apis={this._getApis()} tabName="ExpoComponents" />;
  }

  _getApis = () => {
    const screens = [
      'AdMob',
      'BarCodeScanner',
      'BlurView',
      'Camera',
      'DateTimePicker',
      'ExpoImage',
      'FacebookAds',
      'GestureHandlerList',
      'GestureHandlerPinch',
      'GestureHandlerSwipeable',
      'Gif',
      'GL',
      'HTML',
      'LinearGradient',
      'Lottie',
      'Maps',
      'MaskedView',
      'ReanimatedImagePreview',
      'ReanimatedProgress',
      'Screens',
      'SharedElement',
      'SVG',
      'ViewPager',
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
