import nullthrows from 'nullthrows';
import React from 'react';
import { View, ViewPropTypes, requireNativeComponent } from 'react-native';

import { AdIconViewContext, AdIconViewContextValue } from './withNativeAd';

type Props = React.ElementProps<View>;

export default class AdIconView extends React.Component<Props> {
  render() {
    return (
      <AdIconViewContext.Consumer>
        {(contextValue: AdIconViewContextValue | null) => {
          let context = nullthrows(contextValue);
          return <NativeAdIconView {...this.props} ref={context.nativeRef} />;
        }}
      </AdIconViewContext.Consumer>
    );
  }
}

// The native AdIconView has the same props as regular View
export type NativeAdIconView = React.Component<Props>;
export const NativeAdIconView = requireNativeComponent<Props>('AdIconView', {
  propTypes: ViewPropTypes,
});
