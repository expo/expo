import nullthrows from 'nullthrows';
import React from 'react';
import { View, findNodeHandle } from 'react-native';
import { requireNativeViewManager } from '@unimodules/core';

import { AdChoiceViewContext, AdChoiceViewContextValue } from './withNativeAd';

enum NativeOrientation {
  Horizontal = 0,
  Vertical = 1,
}

type Props = React.ComponentProps<typeof View> & {
  iconSize: number;
  orientation: 'horizontal' | 'vertical';
};

export default class AdChoiceView extends React.Component<Props> {
  static defaultProps = {
    iconSize: 23,
    orientation: 'horizontal',
  };

  shouldAlignHorizontal = () => this.props.orientation === 'horizontal';

  render() {
    const style = this.shouldAlignHorizontal()
      ? {
          minWidth: this.props.iconSize * 2,
          minHeight: this.props.iconSize,
        }
      : {
          minWidth: this.props.iconSize,
          minHeight: this.props.iconSize * 2,
        };

    return (
      <AdChoiceViewContext.Consumer>
        {(contextValue: AdChoiceViewContextValue | null) => {
          let adViewRef = nullthrows(contextValue && contextValue.nativeAdViewRef);
          return (
            <NativeAdChoiceView
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
      </AdChoiceViewContext.Consumer>
    );
  }
}

// The native AdChoiceView has the same props as regular View
export type NativeAdChoiceView = React.Component<Props>;
export const NativeAdChoiceView = requireNativeViewManager('AdChoiceView');
