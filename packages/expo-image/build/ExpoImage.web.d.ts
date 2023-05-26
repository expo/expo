import { ImageNativeProps } from './Image.types';
export declare const ExpoImageModule: {
    prefetch(urls: string | string[]): void;
    clearMemoryCache(): Promise<boolean>;
    clearDiskCache(): Promise<boolean>;
};
export default function ExpoImage({ source, placeholder, contentFit, contentPosition, placeholderContentFit, onLoad, transition, onError, responsivePolicy, onLoadEnd, priority, blurRadius, recyclingKey, ...props }: ImageNativeProps): JSX.Element;
//# sourceMappingURL=ExpoImage.web.d.ts.map