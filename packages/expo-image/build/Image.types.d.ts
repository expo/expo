import { ImageStyle as RNImageStyle, ViewProps } from 'react-native';
export type ImageSource = {
    /**
     * A string representing the resource identifier for the image,
     * which could be an http address, a local file path, or the name of a static image resource.
     */
    uri?: string;
    /**
     * An object representing the HTTP headers to send along with the request for a remote image.
     * @platform android
     * @platform ios
     */
    headers?: Record<string, string>;
    /**
     * Can be specified if known at build time, in which case the value
     * will be used to set the default `<Image/>` component dimension
     */
    width?: number;
    /**
     * Can be specified if known at build time, in which case the value
     * will be used to set the default `<Image/>` component dimension
     */
    height?: number;
    /**
     * The blurhash string to use to generate the image. You can read more about the blurhash
     * on [`woltapp/blurhash`](https://github.com/woltapp/blurhash) repo. Ignored when `uri` is provided.
     * When using the blurhash, you should also provide `width` and `height` (higher values reduce performance),
     * otherwise their default value is `16`.
     */
    blurhash?: string;
    /**
     * The cache key used to query and store this specific image.
     * If not provided, the `uri` is used also as the cache key.
     */
    cacheKey?: string;
};
/**
 * @hidden
 */
export type ImageStyle = RNImageStyle;
/**
 * Determines how the image should be resized to fit its container.
 * @hidden Described in the {@link ImageProps['contentFit']}
 */
export type ImageContentFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
/**
 * Some props are from React Native Image that Expo Image supports (more or less) for easier migration,
 * but all of them are deprecated and might be removed in the future.
 */
export interface ImageProps extends ViewProps {
    /** @hidden */
    style?: RNImageStyle | RNImageStyle[];
    /**
     * The image source, either a remote URL, a local file resource or a number that is the result of the `require()` function.
     * When provided as an array of sources, the source that fits best into the container size and is closest to the screen scale
     * will be chosen. In this case it is important to provide `width`, `height` and `scale` properties.
     */
    source?: ImageSource | string | number | ImageSource[] | string[] | null;
    /**
     * An image to display while loading the proper image and no image has been displayed yet or the source is unset.
     */
    placeholder?: ImageSource | string | number | ImageSource[] | string[] | null;
    /**
     * Determines how the image should be resized to fit its container. This property tells the image to fill the container
     * in a variety of ways; such as "preserve that aspect ratio" or "stretch up and take up as much space as possible".
     * It mirrors the CSS [`object-fit`](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit) property.
     *
     * - `'cover'` - The image is sized to maintain its aspect ratio while filling the container box.
     * If the image's aspect ratio does not match the aspect ratio of its box, then the object will be clipped to fit.
     *
     * - `'contain'` - The image is scaled down or up to maintain its aspect ratio while fitting within the container box.
     *
     * - `'fill'` - The image is sized to entirely fill the container box. If necessary, the image will be stretched or squished to fit.
     *
     * - `'none'` - The image is not resized and is centered by default.
     * When specified, the exact position can be controlled with [`contentPosition`](#contentposition) prop.
     *
     * - `'scale-down'` - The image is sized as if `none` or `contain` were specified, whichever would result in a smaller concrete image size.
     *
     * @default 'cover'
     */
    contentFit?: ImageContentFit;
    /**
     * Determines how the placeholder should be resized to fit its container
     * @hidden Described in the {@link ImageProps['contentFit']}
     * @default 'scale-down'
     */
    placeholderContentFit?: ImageContentFit;
    /**
     * It is used together with [`contentFit`](#contentfit) to specify how the image should be positioned with x/y coordinates inside its own container.
     * An equivalent of the CSS [`object-position`](https://developer.mozilla.org/en-US/docs/Web/CSS/object-position) property.
     * @default 'center'
     */
    contentPosition?: ImageContentPosition;
    /**
     * Describes how the image view should transition the contents when switching the image source.\
     * If provided as a number, it is the duration in milliseconds of the `'cross-dissolve'` effect.
     */
    transition?: ImageTransition | number | null;
    /**
     * The radius of the blur in points, `0` means no blur effect.
     * This effect is not applied to placeholders.
     * @default 0
     */
    blurRadius?: number;
    /**
     * A color used to tint template images (a bitmap image where only the opacity matters).
     * The color is applied to every non-transparent pixel, causing the image’s shape to adopt that color.
     * This effect is not applied to placeholders.
     * @default null
     * @platform android
     * @platform ios
     */
    tintColor?: string | null;
    /**
     * Priorities for completing loads. If more than one load is queued at a time,
     * the load with the higher priority will be started first.
     * Priorities are considered best effort, there are no guarantees about the order in which loads will start or finish.
     * @default 'normal'
     */
    priority?: 'low' | 'normal' | 'high' | null;
    /**
     * Determines whether to cache the image and where: on the disk, in the memory or both.
     *
     * - `'none'` - Image is not cached at all.
     *
     * - `'disk'` - Image is queried from the disk cache if exists, otherwise it's downloaded and then stored on the disk.
     *
     * - `'memory'` - Image is cached in memory. Might be useful when you render a high-resolution picture many times.
     * Memory cache may be purged very quickly to prevent high memory usage and the risk of out of memory exceptions.
     *
     * - `'memory-disk'` - Image is cached in memory, but with a fallback to the disk cache.
     *
     * @default 'disk'
     */
    cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk' | /** @hidden */ null;
    /**
     * Determines whether to choose image source based on container size only on mount or on every resize.
     * Use `initial` to improve performance.
     * @default "live"
     * @platform web
     */
    responsivePolicy?: 'live' | 'initial';
    /**
     * Changing this prop resets the image view content to blank or a placeholder before loading and rendering the final image.
     * This is especially useful for any kinds of recycling views like [FlashList](https://github.com/shopify/flash-list)
     * to prevent showing the previous source before the new one fully loads.
     * @default null
     * @platform android
     * @platform ios
     */
    recyclingKey?: string | null;
    /**
     * Called when the image starts to load.
     */
    onLoadStart?: () => void;
    /**
     * Called when the image load completes successfully.
     */
    onLoad?: (event: ImageLoadEventData) => void;
    /**
     * Called when the image is loading. Can be called multiple times before the image has finished loading.
     * The event object provides details on how many bytes were loaded so far and what's the expected total size.
     */
    onProgress?: (event: ImageProgressEventData) => void;
    /**
     * Called on an image fetching error.
     */
    onError?: (event: ImageErrorEventData) => void;
    /**
     * Called when the image load either succeeds or fails.
     */
    onLoadEnd?: () => void;
    /**
     * @deprecated Provides compatibility for [`defaultSource` from React Native Image](https://reactnative.dev/docs/image#defaultsource).
     * Use [`placeholder`](#placeholder) prop instead.
     */
    defaultSource?: ImageSource | null;
    /**
     * @deprecated Provides compatibility for [`loadingIndicatorSource` from React Native Image](https://reactnative.dev/docs/image#loadingindicatorsource).
     * Use [`placeholder`](#placeholder) prop instead.
     */
    loadingIndicatorSource?: ImageSource | null;
    /**
     * @deprecated Provides compatibility for [`resizeMode` from React Native Image](https://reactnative.dev/docs/image#resizemode).
     * Note that `"repeat"` option is not supported at all.
     * Use the more powerful [`contentFit`](#contentfit) and [`contentPosition`](#contentposition) props instead.
     */
    resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
    /**
     * @deprecated Provides compatibility for [`fadeDuration` from React Native Image](https://reactnative.dev/docs/image#fadeduration-android).
     * Instead use [`transition`](#transition) with the provided duration.
     */
    fadeDuration?: number;
    /**
     * Whether this View should be focusable with a non-touch input device and receive focus with a hardware keyboard.
     * @default false
     * @platform android
     */
    focusable?: boolean;
    /**
     * When true, indicates that the view is an accessibility element.
     * When a view is an accessibility element, it groups its children into a single selectable component.
     *
     * On Android, the `accessible` property will be translated into the native `isScreenReaderFocusable`,
     * so it's only affecting the screen readers behaviour.
     * @default false
     * @platform android
     * @platform ios
     */
    accessible?: boolean;
    /**
     * The text that's read by the screen reader when the user interacts with the image.
     * @default undefined
     * @platform android
     * @platform ios
     */
    accessibilityLabel?: string;
    /**
     * Enables Live Text interaction with the image. Check official [Apple documentation](https://developer.apple.com/documentation/visionkit/enabling_live_text_interactions_with_images) for more details.
     * @default false
     * @platform ios 16.0+
     */
    enableLiveTextInteraction?: boolean;
}
/**
 * It narrows down some props to types expected by the native/web side.
 * @hidden
 */
export interface ImageNativeProps extends ImageProps {
    style?: RNImageStyle;
    source?: ImageSource[];
    placeholder?: ImageSource[];
    contentPosition?: ImageContentPositionObject;
    transition?: ImageTransition | null;
}
/**
 * A value that represents the relative position of a single axis.
 *
 * If `number`, it is a distance in points (logical pixels) from the respective edge.\
 * If `string`, it must be a percentage value where `'100%'` is the difference in size between the container and the image along the respective axis,
 * or `'center'` which is an alias for `'50%'` that is the default value. You can read more regarding percentages on the MDN docs for
 * [`background-position`](https://developer.mozilla.org/en-US/docs/Web/CSS/background-position#regarding_percentages) that describes this concept well.
 */
export type ImageContentPositionValue = number | string | `${number}%` | `${number}` | 'center';
/**
 * Specifies the position of the image inside its container. One value controls the x-axis and the second value controls the y-axis.
 *
 * Additionally, it supports stringified shorthand form that specifies the edges to which to align the image content:\
 * `'center'`, `'top'`, `'right'`, `'bottom'`, `'left'`, `'top center'`, `'top right'`, `'top left'`, `'right center'`, `'right top'`,
 * `'right bottom'`, `'bottom center'`, `'bottom right'`, `'bottom left'`, `'left center'`, `'left top'`, `'left bottom'`.\
 * If only one keyword is provided, then the other dimension is set to `'center'` (`'50%'`), so the image is placed in the middle of the specified edge.\
 * As an example, `'top right'` is the same as `{ top: 0, right: 0 }` and `'bottom'` is the same as `{ bottom: 0, left: '50%' }`.
 */
export type ImageContentPosition = 
/**
 * An object that positions the image relatively to the top-right corner.
 */
{
    top?: ImageContentPositionValue;
    right?: ImageContentPositionValue;
} | 
/**
 * An object that positions the image relatively to the top-left corner.
 */
{
    top?: ImageContentPositionValue;
    left?: ImageContentPositionValue;
} | 
/**
 * An object that positions the image relatively to the bottom-right corner.
 */
{
    bottom?: ImageContentPositionValue;
    right?: ImageContentPositionValue;
} | 
/**
 * An object that positions the image relatively to the bottom-left corner.
 */
{
    bottom?: ImageContentPositionValue;
    left?: ImageContentPositionValue;
} | ImageContentPositionString;
/**
 * @hidden It's described as part of {@link ImageContentPosition}.
 */
export type ImageContentPositionString = 'center' | 'top' | 'right' | 'bottom' | 'left' | 'top center' | 'top right' | 'top left' | 'right center' | 'right top' | 'right bottom' | 'bottom center' | 'bottom right' | 'bottom left' | 'left center' | 'left top' | 'left bottom';
type OnlyObject<T> = T extends object ? T : never;
/**
 * @hidden It's a conditional type that matches only objects of {@link ImageContentPosition}.
 */
export type ImageContentPositionObject = OnlyObject<ImageContentPosition>;
/**
 * An object that describes the smooth transition when switching the image source.
 */
export type ImageTransition = {
    /**
     * The duration of the transition in milliseconds.
     * @default 0
     */
    duration?: number;
    /**
     * Specifies the speed curve of the transition effect and how intermediate values are calculated.
     * @default 'ease-in-out'
     */
    timing?: 'ease-in-out' | 'ease-in' | 'ease-out' | 'linear';
    /**
     * An animation effect used for transition.
     * @default 'cross-dissolve'
     *
     * On Android, only `'cross-dissolve'` is supported.
     * On Web, `'curl-up'` and `'curl-down'` effects are not supported.
     */
    effect?: 'cross-dissolve' | 'flip-from-top' | 'flip-from-right' | 'flip-from-bottom' | 'flip-from-left' | 'curl-up' | 'curl-down' | null;
};
export type ImageLoadEventData = {
    cacheType: 'none' | 'disk' | 'memory';
    source: {
        url: string;
        width: number;
        height: number;
        mediaType: string | null;
    };
};
export type ImageProgressEventData = {
    loaded: number;
    total: number;
};
export type ImageErrorEventData = {
    error: string;
};
export {};
//# sourceMappingURL=Image.types.d.ts.map