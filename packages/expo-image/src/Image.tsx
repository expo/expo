import { Platform, UnavailabilityError } from 'expo-modules-core';
import React from 'react';
import {
  AccessibilityProps,
  ImageResizeMode,
  ImageSourcePropType,
  ImageStyle as RNImageStyle,
  NativeSyntheticEvent,
  StyleProp,
  StyleSheet,
} from 'react-native';

import ExpoImage, { ExpoImageModule } from './ExpoImage';
import { ImageErrorEventData, ImageLoadEventData, ImageLoadProgressEventData } from './Image.types';

const DEFAULT_RESIZE_MODE = 'cover';

interface ImageStyle extends RNImageStyle {
  elevation?: number;
}

export interface ImageProps extends AccessibilityProps {
  // On one hand we want to pass resolved source to native module.
  // On the other hand, react-native-web doesn't expose a resolveAssetSource
  // function, so we can't use it there. So we pass the unresolved source
  // to "native components" and they decide whether to resolve the value
  // or not.
  source?: ImageSourcePropType | null;
  style?: StyleProp<ImageStyle>;
  defaultSource?: ImageSourcePropType | null;
  loadingIndicatorSource?: ImageSourcePropType | null;
  resizeMode?: ImageResizeMode;
  /**
   * @Android only
   */
  blurRadius?: number;
  fadeDuration?: number;

  onLoadStart?: () => void;
  onProgress?: (event: NativeSyntheticEvent<ImageLoadProgressEventData>) => void;
  onLoad?: (event: NativeSyntheticEvent<ImageLoadEventData>) => void;
  onError?: (error: NativeSyntheticEvent<ImageErrorEventData>) => void;
  onLoadEnd?: () => void;
}

interface ImageState {
  onLoad: ImageProps['onLoad'];
  onError: ImageProps['onError'];
}

export default class Image extends React.Component<ImageProps, ImageState> {
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
    const resizeMode = resizeModeProp ?? resizeModeStyle ?? DEFAULT_RESIZE_MODE;

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
