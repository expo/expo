import React from 'react';
import { ImageProps } from './Image.types';
export declare class Image extends React.PureComponent<ImageProps> {
    nativeViewRef: any;
    constructor(props: any);
    /**
     * Preloads images at the given urls that can be later used in the image view.
     * Preloaded images are always cached to the disk with the option of also
     * caching to memory.
     * @param urls - A url string or an array of urls of images to prefetch.
     * @param cachePolicy - The cache policy for pre-fetched images. Defaults to
     * disk
     * @return A promise resolving to `true` when the images have been prefetched.
     * If any of the images fail to be prefetched, the promise will resolve to
     * `false`.
     */
    static prefetch(urls: string | string[], cachePolicy?: 'disk' | 'memory-disk'): Promise<boolean>;
    /**
     * Cancels in progress prefetch requests.
     */
    static cancelPrefetch(): void;
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