import React from 'react';
import { ImagePrefetchOptions, ImageProps } from './Image.types';
export declare class Image extends React.PureComponent<ImageProps> {
    nativeViewRef: any;
    containerViewRef: any;
    constructor(props: any);
    getAnimatableRef: () => any;
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
    static prefetch(urls: string | string[], cachePolicy?: ImagePrefetchOptions['cachePolicy']): Promise<boolean>;
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
    static prefetch(urls: string | string[], options?: ImagePrefetchOptions): Promise<boolean>;
    /**
     * Asynchronously clears all images stored in memory.
     * @platform android
     * @platform ios
     * @return A promise resolving to `true` when the operation succeeds.
     * It may resolve to `false` on Android when the activity is no longer available.
     * Resolves to `false` on Web.
     */
    static clearMemoryCache(): Promise<boolean>;
    /**
     * Asynchronously clears all images from the disk cache.
     * @platform android
     * @platform ios
     * @return A promise resolving to `true` when the operation succeeds.
     * It may resolve to `false` on Android when the activity is no longer available.
     * Resolves to `false` on Web.
     */
    static clearDiskCache(): Promise<boolean>;
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
    static getCachePathAsync(cacheKey: string): Promise<string | null>;
    /**
     * Asynchronously generates a [Blurhash](https://blurha.sh) from an image.
     * @param url - The URL of the image to generate a blurhash from.
     * @param numberOfComponents - The number of components to encode the blurhash with.
     * Must be between 1 and 9. Defaults to `[4, 3]`.
     * @platform ios
     * @return A promise resolving to the blurhash string.
     */
    static generateBlurhashAsync(url: string, numberOfComponents: [number, number] | {
        width: number;
        height: number;
    }): Promise<string | null>;
    /**
     * Asynchronously starts playback of the view's image if it is animated.
     * @platform android
     * @platform ios
     */
    startAnimating(): Promise<void>;
    /**
     * Asynchronously stops the playback of the view's image if it is animated.
     * @platform android
     * @platform ios
     */
    stopAnimating(): Promise<void>;
    render(): JSX.Element;
}
//# sourceMappingURL=Image.d.ts.map