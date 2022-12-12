import React from 'react';
import { ImageProps } from './Image.types';
export declare class Image extends React.Component<ImageProps> {
    /**
     * **Available on @Android only.** Caching the image that can be later used in ImageView
     * @return an empty promise.
     */
    static prefetch(url: string): Promise<void>;
    /**
     * Asynchronously clears all images stored in memory.
     * @return A promise resolving to `true` when the operation succeeds.
     * It may resolve to `false` on Android when the activity is no longer available.
     */
    static clearMemoryCache(): Promise<boolean>;
    /**
     * Asynchronously clears all images from the disk cache.
     * @return A promise resolving to `true` when the operation succeeds.
     * It may resolve to `false` on Android when the activity is no longer available.
     */
    static clearDiskCache(): Promise<boolean>;
    render(): JSX.Element;
}
//# sourceMappingURL=Image.d.ts.map