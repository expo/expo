import React from 'react';
import { AccessibilityProps, ImageSourcePropType, ImageStyle, StyleProp } from 'react-native';

import ExpoImage from './ExpoImage';

export interface ImageProps extends AccessibilityProps {
  // On one hand we want to pass resolved source to native module.
  // On the other hand, react-native-web doesn't expose a resolveAssetSource
  // function, so we can't use it there. So we pass the unresolved source
  // to "native components" and they decide whether to resolve the value
  // or not.
  source?: ImageSourcePropType | null;
  style?: StyleProp<ImageStyle>;
}

export default class Image extends React.Component<ImageProps> {
  render() {
    return <ExpoImage {...this.props} />;
  }
}
