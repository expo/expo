import React from 'react';
import { Platform } from 'react-native';
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
    const screens = Platform.select({
      web: [
        'AdMob',
        'BlurView',
        'Camera',
        'ImagePreview',
        'Gif',
        'GL',
        'LinearGradient',
        'Lottie',
        'Maps',
        'SVG',
        'Video',
      ],
      default: [
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
      ],
    });
    return screens.map(name => ({ name, isAvailable: !!Screens[name] }));
  };
}
