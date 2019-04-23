import React from 'react';
import { View } from 'react-native';
import { requireNativeViewManager } from '@unimodules/core';

type Props = {
  placementId: string;
  type: BannerAdType;
  onPress?: () => void;
  onError?: (error: Error) => void;
} & React.ComponentProps<typeof View>;

type BannerAdType = 'large' | 'rectangle' | 'standard';

export default class BannerAd extends React.Component<Props> {
  render() {
    let { type, onPress, onError, style, ...props } = this.props;
    let size = _getSizeForAdType(type);

    return (
      <NativeBannerView
        size={size}
        onAdPress={onPress}
        onAdError={onError}
        style={[style, { height: size }]}
        {...props}
      />
    );
  }
}

function _getSizeForAdType(type: BannerAdType): number {
  const sizes = { standard: 50, large: 90, rectangle: 250 };
  return sizes.hasOwnProperty(type) ? sizes[type] : sizes.standard;
}

const NativeBannerView = requireNativeViewManager('CTKBannerView');
