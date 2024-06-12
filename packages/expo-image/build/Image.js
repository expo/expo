import { Platform, createSnapshotFriendlyRef } from 'expo-modules-core';
import React from 'react';
import { StyleSheet } from 'react-native';
import ExpoImage, { ExpoImageModule } from './ExpoImage';
import { resolveContentFit, resolveContentPosition, resolveTransition } from './utils';
import { resolveSources } from './utils/resolveSources';
let loggedDefaultSourceDeprecationWarning = false;
export class Image extends React.PureComponent {
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
        }
        else {
            return this;
        }
    };
    static async prefetch(urls, options) {
        let cachePolicy = 'memory-disk';
        let headers;
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
    static async clearMemoryCache() {
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
    static async clearDiskCache() {
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
    static async getCachePathAsync(cacheKey) {
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
    static async generateBlurhashAsync(url, numberOfComponents) {
        return await ExpoImageModule.generateBlurhashAsync(url, numberOfComponents);
    }
    /**
     * Asynchronously starts playback of the view's image if it is animated.
     * @platform android
     * @platform ios
     */
    async startAnimating() {
        await this.nativeViewRef.current.startAnimating();
    }
    /**
     * Asynchronously stops the playback of the view's image if it is animated.
     * @platform android
     * @platform ios
     */
    async stopAnimating() {
        await this.nativeViewRef.current.stopAnimating();
    }
    render() {
        const { style, source, placeholder, contentFit, contentPosition, transition, fadeDuration, resizeMode: resizeModeProp, defaultSource, loadingIndicatorSource, ...restProps } = this.props;
        const { resizeMode: resizeModeStyle, ...restStyle } = StyleSheet.flatten(style) || {};
        const resizeMode = resizeModeProp ?? resizeModeStyle;
        if ((defaultSource || loadingIndicatorSource) && !loggedDefaultSourceDeprecationWarning) {
            console.warn('[expo-image]: `defaultSource` and `loadingIndicatorSource` props are deprecated, use `placeholder` instead');
            loggedDefaultSourceDeprecationWarning = true;
        }
        return (<ExpoImage {...restProps} style={restStyle} source={resolveSources(source)} placeholder={resolveSources(placeholder ?? defaultSource ?? loadingIndicatorSource)} contentFit={resolveContentFit(contentFit, resizeMode)} contentPosition={resolveContentPosition(contentPosition)} transition={resolveTransition(transition, fadeDuration)} nativeViewRef={this.nativeViewRef} containerViewRef={this.containerViewRef}/>);
    }
}
//# sourceMappingURL=Image.js.map