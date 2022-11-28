import React from 'react';
import { ImageProps } from './Image.types';
export declare class Image extends React.Component<ImageProps> {
    /**
     * **Available on @Android only.** Caching the image that can be later used in ImageView
     * @return an empty promise.
     */
    static prefetch(url: string): Promise<void>;
    render(): JSX.Element;
}
//# sourceMappingURL=Image.d.ts.map