import { Platform, UnavailabilityError } from 'expo-modules-core';
import React from 'react';
import { StyleSheet } from 'react-native';

import ExpoImage, { ExpoImageModule } from './ExpoImage';
import { ImageProps, ImageResizeMode } from './Image.types';

type ImageState = {
  onLoad: ImageProps['onLoad'];
  onError: ImageProps['onError'];
};

export class Image extends React.Component<ImageProps, ImageState> {
  static getDerivedStateFromProps(props: ImageProps) {
    return {
      onLoad: props.onLoadEnd
        ? (e) => {
            if (props.onLoad) {
              props.onLoad(e);
            }
            props.onLoadEnd!();
          }
        : props.onLoad,
      onError: props.onLoadEnd
        ? (e) => {
            if (props.onError) {
              props.onError(e);
            }
            props.onLoadEnd!();
          }
        : props.onError,
    };
  }

  /**
   * **Available on @Android only.** Caching the image that can be later used in ImageView
   * @return an empty promise.
   */
  static async prefetch(url: string): Promise<void> {
    if (Platform.OS !== 'android') {
      throw new UnavailabilityError('Image', 'prefetch');
    }
    return await ExpoImageModule.prefetch(url);
  }

  state = {
    onLoad: undefined,
    onError: undefined,
  };

  render() {
    const { style, resizeMode: resizeModeProp, ...restProps } = this.props;

    const { resizeMode: resizeModeStyle, ...restStyle } = StyleSheet.flatten([style]) || {};
    const resizeMode = resizeModeProp ?? resizeModeStyle ?? ImageResizeMode.COVER;

    return (
      <ExpoImage
        {...restProps}
        style={restStyle}
        resizeMode={resizeMode}
        onLoad={this.state.onLoad}
        onError={this.state.onError}
      />
    );
  }
}
