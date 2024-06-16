import { Platform, createSnapshotFriendlyRef } from 'expo-modules-core';
import React from 'react';
import { StyleSheet } from 'react-native';

import ExpoImage, { ExpoImageModule } from './ExpoImage';
import { ImagePrefetchOptions, ImageProps } from './Image.types';
import { resolveContentFit, resolveContentPosition, resolveTransition } from './utils';
import { resolveSources } from './utils/resolveSources';

let loggedDefaultSourceDeprecationWarning = false;

export class Image extends React.PureComponent<ImageProps> {
  nativeViewRef;
  containerViewRef;
  constructor(props) {
    super(props);
    this.nativeViewRef = createSnapshotFriendlyRef();
    this.containerViewRef = createSnapshotFriendlyRef();
  }

  // Reanimated support on web
  getAnimatableRef = () => {
    if (Platform.OS === 'web') {
      return this.containerViewRef.current;
    } else {
      return this;
    }
  };

  /**
   * Preloads images at the given URLs that can be later used in the image view.
   * Preloaded images are cached to the memory and disk by default, so make sure
   * to use `disk` (default) or `memory-disk` [cache policy](#cachepolicy).
   * @param urls - A URL string or an array of URLs of images to prefetch.
   * @param {ImagePrefetchOptions['cachePolicy']} cachePolicy - The cache policy for prefetched images.
   * @return A promise resolving to `true` as soon as all images have been
   * successfully prefetched. If an image fails to be prefetched, the promise
   * will immediately resolve to `false` regardless of whether other images have
   * finished prefetching.
   */
  static async prefetch(
    urls: string | string[],
    cachePolicy?: ImagePrefetchOptions['cachePolicy']
  ): Promise<boolean>;
  /**
   * Preloads images at the given URLs that can be later used in the image view.
   * Preloaded images are cached to the memory and disk by default, so make sure
   * to use `disk` (default) or `memory-disk` [cache policy](#cachepolicy).
   * @param urls - A URL string or an array of URLs of images to prefetch.
   * @param options - Options for prefetching images.
   * @return A promise resolving to `true` as soon as all images have been
   * successfully prefetched. If an image fails to be prefetched, the promise
   * will immediately resolve to `false` regardless of whether other images have
   * finished prefetching.
   */
  static async prefetch(urls: string | string[], options?: ImagePrefetchOptions): Promise<boolean>;
  static async prefetch(
    urls: string | string[],
    options?: ImagePrefetchOptions['cachePolicy'] | ImagePrefetchOptions
  ): Promise<boolean> {
    let cachePolicy: ImagePrefetchOptions['cachePolicy'] = 'memory-disk';
    let headers: ImagePrefetchOptions['headers'];
    switch (typeof options) {
      case 'string':
        cachePolicy = options;
        break;
      case 'object':
        cachePolicy = options.cachePolicy ?? cachePolicy;
        headers = options.headers;
        break;
    }

    return ExpoImageModule.prefetch(Array.isArray(urls) ? urls : [urls], cachePolicy, headers);
  }

  /**
   * Asynchronously clears all images stored in memory.
   * @platform android
   * @platform ios
   * @return A promise resolving to `true` when the operation succeeds.
   * It may resolve to `false` on Android when the activity is no longer available.
   * Resolves to `false` on Web.
   */
  static async clearMemoryCache(): Promise<boolean> {
    return await ExpoImageModule.clearMemoryCache();
  }

  /**
   * Asynchronously clears all images from the disk cache.
   * @platform android
   * @platform ios
   * @return A promise resolving to `true` when the operation succeeds.
   * It may resolve to `false` on Android when the activity is no longer available.
   * Resolves to `false` on Web.
   */
  static async clearDiskCache(): Promise<boolean> {
    return await ExpoImageModule.clearDiskCache();
  }

  /**
   * Asynchronously checks if an image exists in the disk cache and resolves to
   * the path of the cached image if it does.
   * @param cacheKey - The cache key for the requested image. Unless you have set
   * a custom cache key, this will be the source URL of the image.
   * @platform android
   * @platform ios
   * @return A promise resolving to the path of the cached image. It will resolve
   * to `null` if the image does not exist in the cache.
   */
  static async getCachePathAsync(cacheKey: string): Promise<string | null> {
    return await ExpoImageModule.getCachePathAsync(cacheKey);
  }

  /**
   * Asynchronously generates a [Blurhash](https://blurha.sh) from an image.
   * @param url - The URL of the image to generate a blurhash from.
   * @param numberOfComponents - The number of components to encode the blurhash with.
   * Must be between 1 and 9. Defaults to `[4, 3]`.
   * @platform ios
   * @return A promise resolving to the blurhash string.
   */
  static async generateBlurhashAsync(
    url: string,
    numberOfComponents: [number, number] | { width: number; height: number }
  ): Promise<string | null> {
    return await ExpoImageModule.generateBlurhashAsync(url, numberOfComponents);
  }

  /**
   * Asynchronously starts playback of the view's image if it is animated.
   * @platform android
   * @platform ios
   */
  async startAnimating(): Promise<void> {
    await this.nativeViewRef.current.startAnimating();
  }

  /**
   * Asynchronously stops the playback of the view's image if it is animated.
   * @platform android
   * @platform ios
   */
  async stopAnimating(): Promise<void> {
    await this.nativeViewRef.current.stopAnimating();
  }

  render() {
    const {
      style,
      source,
      placeholder,
      contentFit,
      contentPosition,
      transition,
      fadeDuration,
      resizeMode: resizeModeProp,
      defaultSource,
      loadingIndicatorSource,
      ...restProps
    } = this.props;

    const { resizeMode: resizeModeStyle, ...restStyle } = StyleSheet.flatten(style) || {};
    const resizeMode = resizeModeProp ?? resizeModeStyle;

    if ((defaultSource || loadingIndicatorSource) && !loggedDefaultSourceDeprecationWarning) {
      console.warn(
        '[expo-image]: `defaultSource` and `loadingIndicatorSource` props are deprecated, use `placeholder` instead'
      );
      loggedDefaultSourceDeprecationWarning = true;
    }

    return (
      <ExpoImage
        {...restProps}
        style={restStyle}
        source={resolveSources(source)}
        placeholder={resolveSources(placeholder ?? defaultSource ?? loadingIndicatorSource)}
        contentFit={resolveContentFit(contentFit, resizeMode)}
        contentPosition={resolveContentPosition(contentPosition)}
        transition={resolveTransition(transition, fadeDuration)}
        nativeViewRef={this.nativeViewRef}
        containerViewRef={this.containerViewRef}
      />
    );
  }
}
