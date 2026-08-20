import { type ColorValue, type ImageResolvedAssetSource } from 'react-native';
import { type ViewEvent } from '../../types';
import { type ContentAlignment, type PrimitiveBaseProps } from '../layout-types';
/** Controls how an image is scaled inside its bounds. */
export type ImageContentScale = 'fit' | 'crop' | 'fillBounds' | 'fillWidth' | 'fillHeight' | 'inside' | 'none';
/** A bundled image or a single URI-based image source. */
export type ImageSource = number | {
    uri: string;
    width?: number;
    height?: number;
    scale?: number;
};
export interface ImageProps extends PrimitiveBaseProps {
    /**
     * A bundled image or an object containing a single local or remote URI.
     *
     * @example
     * ```tsx
     * <Image source={require('./photo.png')} />
     * <Image source={{ uri: 'file:///path/to/photo.png' }} />
     * ```
     */
    source: ImageSource;
    /**
     * How the image should be scaled to fit its bounds.
     * @default 'fit'
     *
     * @example
     * ```tsx
     * <Image source={require('./photo.png')} contentScale="crop" />
     * ```
     */
    contentScale?: ImageContentScale;
    /**
     * How the image should be aligned within its bounds.
     * @default 'center'
     */
    alignment?: ContentAlignment;
    /**
     * Accessibility label for the image.
     * Used by screen readers to describe the image to users.
     * Use `null` for decorative images.
     *
     * @example
     * ```tsx
     * <Image
     *   source={require('./photo.png')}
     *   contentDescription="A mountain at sunset"
     * />
     * ```
     */
    contentDescription?: string | null;
    /**
     * Optional color applied to every non-transparent image pixel.
     *
     * @example
     * ```tsx
     * <Image source={require('./icon.png')} tint="#007AFF" />
     * <Image source={require('./icon.png')} tint="blue" />
     * ```
     */
    tint?: ColorValue;
    /**
     * Opacity of the image between `0` and `1`.
     * @default 1
     *
     * @example
     * ```tsx
     * <Image source={require('./icon.png')} alpha={0.5} />
     * ```
     */
    alpha?: number;
    /**
     * Callback that is called when the image loads successfully.
     */
    onLoad?: () => void;
    /**
     * Callback that is called when the image fails to load.
     */
    onError?: (error: string) => void;
}
/** @hidden */
export type NativeImageProps = Omit<ImageProps, 'source' | 'onLoad' | 'onError'> & ViewEvent<'onLoad', void> & ViewEvent<'onError', {
    error: string;
}> & {
    source: ImageResolvedAssetSource | null;
};
/**
 * Displays an image using Jetpack Compose.
 *
 * Size the image with modifiers such as `size`, `width`, `height`, or `fillMaxSize`.
 *
 * @example
 * ```tsx
 * import { Image } from '@expo/ui/jetpack-compose';
 * import { size } from '@expo/ui/jetpack-compose/modifiers';
 *
 * <Image
 *   source={require('./photo.png')}
 *   contentScale="crop"
 *   contentDescription="A mountain at sunset"
 *   modifiers={[size(160, 100)]}
 * />
 * ```
 */
export declare function Image(props: ImageProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map