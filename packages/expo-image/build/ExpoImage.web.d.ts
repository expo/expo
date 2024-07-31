import React from 'react';
import type { ImageNativeProps } from './Image.types';
export declare const ExpoImageModule: {
    prefetch(urls: string | string[], _: any, __: any): Promise<boolean>;
    clearMemoryCache(): Promise<boolean>;
    clearDiskCache(): Promise<boolean>;
};
export default function ExpoImage({ source, placeholder, contentFit, contentPosition, placeholderContentFit, cachePolicy, onLoad, transition, onError, responsivePolicy, onLoadEnd, priority, blurRadius, recyclingKey, style, nativeViewRef, accessibilityLabel, tintColor, containerViewRef, ...props }: ImageNativeProps): React.JSX.Element;
//# sourceMappingURL=ExpoImage.web.d.ts.map