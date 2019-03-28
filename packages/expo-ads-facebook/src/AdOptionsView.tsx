import nullthrows from 'nullthrows';
import React from 'react';
import { View, findNodeHandle } from 'react-native';
import { requireNativeViewManager } from '@unimodules/core';

import { AdOptionsViewContext, AdOptionsViewContextValue } from './withNativeAd';

enum NativeOrientation {
  Horizontal = 0,
  Vertical = 1,
}

type Props = React.ComponentProps<typeof View> & {
  iconSize: number;
  iconColor?: string;
  orientation: 'horizontal' | 'vertical';
};

export default class AdOptionsView extends React.Component<Props> {
  static defaultProps = {
    iconSize: 23,
    orientation: 'horizontal',
    style: { alignSelf:'baseline' },
  };

  shouldAlignHorizontal = () => this.props.orientation === 'horizontal';

  render() {
    const style = this.shouldAlignHorizontal()
      ? {
          width: this.props.iconSize * 2,
          height: this.props.iconSize,
        }
      : {
          width: this.props.iconSize,
          height: this.props.iconSize * 2,
        };

    return (
      <AdOptionsViewContext.Consumer>
        {(contextValue: AdOptionsViewContextValue | null) => {
          let adViewRef = nullthrows(contextValue && contextValue.nativeAdViewRef);
          return (
            <NativeAdOptionsView
              {...this.props}
              style={[this.props.style, style]}
              nativeAdViewTag={findNodeHandle(adViewRef.current)}
              orientation={
                this.shouldAlignHorizontal()
                  ? NativeOrientation.Horizontal
                  : NativeOrientation.Vertical
              }
            />
          );
        }}
      </AdOptionsViewContext.Consumer>
    );
  }
}

// The native AdOptionsView has the same props as regular View
export type NativeAdOptionsView = React.Component<Props>;
export const NativeAdOptionsView = requireNativeViewManager('AdOptionsView');
