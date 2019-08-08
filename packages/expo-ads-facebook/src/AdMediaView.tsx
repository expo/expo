import nullthrows from 'nullthrows';
import React from 'react';
import { View } from 'react-native';
import { requireNativeViewManager } from '@unimodules/core';

import { AdMediaViewContext, AdMediaViewContextValue } from './withNativeAd';

type Props = React.ComponentProps<typeof View>;

export default class AdMediaView extends React.Component<Props> {
  render() {
    return (
      <AdMediaViewContext.Consumer>
        {(contextValue: AdMediaViewContextValue | null) => {
          let context = nullthrows(contextValue);
          return <NativeAdMediaView {...this.props} ref={context.nativeRef} />;
        }}
      </AdMediaViewContext.Consumer>
    );
  }
}

// The native AdMediaView has the same props as regular View
export type NativeAdMediaView = React.Component<Props>;
export const NativeAdMediaView = requireNativeViewManager('MediaView');
