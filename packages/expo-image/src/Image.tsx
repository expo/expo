import { Platform, UnavailabilityError } from 'expo-modules-core';
import React from 'react';
import { StyleSheet } from 'react-native';

import ExpoImage, { ExpoImageModule } from './ExpoImage';
import { ImageProps, ImageResizeMode } from './Image.types';

export class Image extends React.Component<ImageProps> {
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

  /**
   * Asynchronously clears all images stored in memory.
   * @return A promise resolving to `true` when the operation succeeds.
   * It may resolve to `false` on Android when the activity is no longer available.
   */
  static async clearMemoryCache(): Promise<boolean> {
    return await ExpoImageModule.clearMemoryCache();
  }

  /**
   * Asynchronously clears all images from the disk cache.
   * @return A promise resolving to `true` when the operation succeeds.
   * It may resolve to `false` on Android when the activity is no longer available.
   */
  static async clearDiskCache(): Promise<boolean> {
    return await ExpoImageModule.clearDiskCache();
  }

  render() {
    const { style, resizeMode: resizeModeProp, ...restProps } = this.props;

    const { resizeMode: resizeModeStyle, ...restStyle } = StyleSheet.flatten([style]) || {};
    const resizeMode = resizeModeProp ?? resizeModeStyle ?? ImageResizeMode.COVER;

    return <ExpoImage {...restProps} style={restStyle} resizeMode={resizeMode} />;
  }
}
