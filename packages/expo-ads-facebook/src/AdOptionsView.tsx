import { requireNativeViewManager } from 'expo-modules-core';
import nullthrows from 'nullthrows';
import React from 'react';
import { Platform, View, findNodeHandle } from 'react-native';

import { AdOptionsViewContext, AdOptionsViewContextValue } from './withNativeAd';

enum NativeOrientation {
  Horizontal = 0,
  Vertical = 1,
}

type Props = React.ComponentPropsWithRef<typeof View> & {
  iconSize: number;
  iconColor?: string;
  orientation: 'horizontal' | 'vertical';
};

export default class AdOptionsView extends React.Component<Props> {
  static defaultProps = {
    iconSize: 23,
    orientation: 'horizontal',
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

    const { iconSize, orientation, ...props } = this.props;
    const platformSpecificProps =
      Platform.OS === 'android'
        ? {
            iconSize,
            orientation: this.shouldAlignHorizontal()
              ? NativeOrientation.Horizontal
              : NativeOrientation.Vertical,
          }
        : null;

    return (
      <AdOptionsViewContext.Consumer>
        {(contextValue: AdOptionsViewContextValue | null) => {
          const adViewRef = nullthrows(contextValue && contextValue.nativeAdViewRef);
          return (
            <NativeAdOptionsView
              {...props}
              {...platformSpecificProps}
              style={[this.props.style, style]}
              nativeAdViewTag={findNodeHandle(adViewRef.current)}
            />
          );
        }}
      </AdOptionsViewContext.Consumer>
    );
  }
}

// The native AdOptionsView has the same props as regular View
export type NativeAdOptionsView = React.Component<Props>;
// eslint-disable-next-line @typescript-eslint/no-redeclare -- the type and variable share a name
export const NativeAdOptionsView: React.ComponentType<any> =
  requireNativeViewManager('AdOptionsView');
