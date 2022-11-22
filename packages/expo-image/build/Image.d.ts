import React from 'react';
import { ImageProps } from './Image.types';
declare type ImageState = {
    onLoad: ImageProps['onLoad'];
    onError: ImageProps['onError'];
};
export declare class Image extends React.Component<ImageProps, ImageState> {
    static getDerivedStateFromProps(props: ImageProps): {
        onLoad: ((event: import("./Image.types").ImageLoadEventData) => void) | undefined;
        onError: ((event: import("./Image.types").ImageErrorEventData) => void) | undefined;
    };
    /**
     * **Available on @Android only.** Caching the image that can be later used in ImageView
     * @return an empty promise.
     */
    static prefetch(url: string): Promise<void>;
    state: {
        onLoad: undefined;
        onError: undefined;
    };
    render(): JSX.Element;
}
export {};
//# sourceMappingURL=Image.d.ts.map