import { ClassAttributes, ComponentProps, ComponentType } from 'react';
import { Image as NativeImage, ImageStyle as NativeImageStyle, StyleProp } from 'react-native';
import { WebViewStyle } from './View';
type NativeImageProps = ComponentProps<typeof NativeImage> & ClassAttributes<typeof NativeImage>;
export interface WebImageStyle {
    opacity?: number;
}
export type ImageStyle = Omit<NativeImageStyle, 'position'> & WebImageStyle & WebViewStyle;
export type WebImageProps = {
    style?: StyleProp<ImageStyle>;
    /** @platform web */
    tabIndex?: number;
    /**
     * Set whether the image can be dragged with native browser behavior.
     * @platform web
     */
    draggable?: boolean;
};
export type ImageProps = Omit<NativeImageProps, 'style'> & WebImageProps;
declare const _default: ComponentType<ImageProps>;
export default _default;
//# sourceMappingURL=Image.d.ts.map