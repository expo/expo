import { requireNativeViewManager } from 'expo-modules-core';
import nullthrows from 'nullthrows';
import React from 'react';
import { View } from 'react-native';

import { AdMediaViewContext, AdMediaViewContextValue } from './withNativeAd';

type Props = React.ComponentPropsWithRef<typeof View>;

export default class AdMediaView extends React.Component<Props> {
  render() {
    return (
      <AdMediaViewContext.Consumer>
        {(contextValue: AdMediaViewContextValue | null) => {
          const context = nullthrows(contextValue);
          return <NativeAdMediaView {...this.props} ref={context.nativeRef} />;
        }}
      </AdMediaViewContext.Consumer>
    );
  }
}

// The native AdMediaView has the same props as regular View
export type NativeAdMediaView = React.Component<Props>;
// eslint-disable-next-line @typescript-eslint/no-redeclare -- the type and variable share a name
export const NativeAdMediaView: React.ComponentType<Props> = requireNativeViewManager('MediaView');
