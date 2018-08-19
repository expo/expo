// @flow

import * as React from 'react';
import { requireNativeComponent } from 'react-native';

import { MediaViewContext } from './withNativeAd';
import type { MediaViewContextValueType } from './withNativeAd';

export const NativeMediaView = requireNativeComponent('MediaView', null, {});

class MediaViewChild extends React.Component<Object> {
  _mediaView: ?React.Node;

  _handleMediaViewMount = (ref: ?React.Node) => {
    if (this._mediaView) {
      this.props.unregister(this._mediaView);
      this._mediaView = null;
    }

    if (ref) {
      this.props.register(ref);
      this._mediaView = ref;
    }
  };

  render() {
    return <NativeMediaView {...this.props} ref={this._handleMediaViewMount} />;
  }
}

export default class MediaView extends React.Component<Object> {
  render() {
    return (
      <MediaViewContext.Consumer>
        {(contextValue: MediaViewContextValueType) => (
          <MediaViewChild {...this.props} {...contextValue} />
        )}
      </MediaViewContext.Consumer>
    );
  }
}
