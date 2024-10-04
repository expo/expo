import { ImageNativeProps } from './Image.types';
export declare const ExpoImageModule: {
    prefetch(urls: string | string[], _: any): Promise<boolean>;
    clearMemoryCache(): Promise<boolean>;
    clearDiskCache(): Promise<boolean>;
};
export default function ExpoImage({ source, placeholder, contentFit, contentPosition, placeholderContentFit, cachePolicy, onLoad, transition, onError, responsivePolicy, onLoadEnd, priority, blurRadius, recyclingKey, style, ...props }: ImageNativeProps): JSX.Element;
//# sourceMappingURL=ExpoImage.web.d.ts.map