import type { ImageNativeProps } from './Image.types';
type ExpoImageWebProps = ImageNativeProps & {
    dataSet?: Record<string, string | undefined>;
};
export default function ExpoImage({ source, placeholder, contentFit, contentPosition, placeholderContentFit, cachePolicy, onLoad, transition, onError, responsivePolicy, onLoadEnd, onDisplay, priority, loading, blurRadius, recyclingKey, style, nativeViewRef, accessibilityLabel, alt, tintColor, containerViewRef, draggable, dataSet, ...props }: ExpoImageWebProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ExpoImage.web.d.ts.map