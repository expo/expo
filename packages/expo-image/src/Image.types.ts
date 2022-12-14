import { AccessibilityProps, ImageStyle as RNImageStyle } from 'react-native';

export type ImageSource = {
  /**
   * A string representing the resource identifier for the image,
   * which could be an http address, a local file path, or the name of a static image resource.
   */
  uri?: string;
  /**
   * An object representing the HTTP headers to send along with the request for a remote image.
   */
  headers?: { [key: string]: string };
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
};

export type ImageStyle = RNImageStyle & {
  resizeMode?: ImageResizeMode;
  elevation?: number;
};

export type ImageProps = AccessibilityProps & {
  style?: ImageStyle;
  /**
   * The image source (either a remote URL or a local file resource).
   */
  source?: ImageSource | string | number | ImageSource[] | string[] | null;

  /**
   * A static image to display while loading the image source.
   */
  placeholder?: ImageSource | string | number | ImageSource[] | string[] | null;

  /**
   * A static image to display while loading the image source.
   * @platform android
   */
  defaultSource?: ImageSource | null;
  /**
   * Similarly to `source`, this property represents the resource used to render the loading indicator for the image.
   * The loading indicator is displayed until image is ready to be displayed, typically after the image is downloaded.
   * @platform android
   */
  loadingIndicatorSource?: ImageSource | null;

  /**
   * Determines how the image should be resized to fit its container.
   * It mirrors the CSS [`object-fit`](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit) property.
   * @default "cover"
   */
  contentFit?: ImageContentFit;

  /**
   * Specifies the alignment of the image within the component's box.
   * Areas of the box which aren't covered by the image will show the component's background.
   * It's an equivalent of the CSS [`object-position`](https://developer.mozilla.org/en-US/docs/Web/CSS/object-position) property.
   */
  contentPosition?: ImageContentPosition;

  /**
   * Determines how to resize the image when the frame doesn't match the raw image dimensions.
   * @default "cover"
   * @deprecated Deprecated in favor of the more powerful `contentFit` and `contentPosition` props.
   */
  resizeMode?: ImageResizeMode;

  /**
   * Object that describes how the image view should transition the contents on props change.
   * @platform ios
   */
  transition?: ImageTransition | number | null;

  /**
   * Fade animation duration in milliseconds.
   * @deprecated This prop is deprecated, use [`transition`](#transition) instead.
   */
  fadeDuration?: number;

  /**
   * Priorities for completing loads. If more than one load is queued at a time,
   * the load with the higher priority will be started first.
   * Priorities are considered best effort, there are no guarantees about the order in which loads will start or finish.
   * @default ImagePriority.NORMAL
   * @platform android
   */
  priority?: ImagePriority | null;

  /**
   * Determines whether to cache the image and where: on the disk, in the memory or both.
   * > Note: Memory cache may be purged very quickly to prevent high memory usage and the risk of out of memory exceptions.
   * @default ImageCachePolicy.DISK
   */
  cachePolicy?: ImageCachePolicy | null;

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
};

/**
 * @hidden
 */
export interface ImageNativeProps extends ImageProps {
  source?: ImageSource[];
  placeholder?: ImageSource[];
}

/**
 * Determines how the image should be resized to fit its container.
 */
export enum ImageContentFit {
  /**
   * The image is sized to maintain its aspect ratio while filling the element's entire content box.
   * If the image's aspect ratio does not match the aspect ratio of its box, then the object will be clipped to fit.
   */
  COVER = 'cover',

  /**
   * The image is scaled to maintain its aspect ratio while fitting within the element's content box.
   * The entire image is made to fill the box, while preserving its aspect ratio,
   * so the image will be "letterboxed" if its aspect ratio does not match the aspect ratio of the box.
   */
  CONTAIN = 'contain',

  /**
   * The image is sized to fill the element's content box. The entire object will completely fill the box.
   * If the image's aspect ratio does not match the aspect ratio of its box, then the image will be stretched to fit.
   */
  FILL = 'fill',

  /**
   * The image is not resized and is centered by default.
   * When specified, the exact position can be controlled with `objectPosition` option.
   */
  NONE = 'none',

  /**
   * The image is sized as if `none` or `contain` were specified,
   * whichever would result in a smaller concrete object size.
   */
  SCALE_DOWN = 'scale-down',
}

/**
 * @docsMissing
 */
export type PositionValue = number | `${number}%` | `${number}` | 'center';

/**
 * @docsMissing
 */
export type ImageContentPositionObject =
  | { top?: PositionValue; right?: PositionValue }
  | { top?: PositionValue; left?: PositionValue }
  | { bottom?: PositionValue; right?: PositionValue }
  | { bottom?: PositionValue; left?: PositionValue };

/**
 * A stringified and shorthand form of the `contentPosition` prop. This specifies the edges to which to align the image content.
 * If only one keyword is provided, the other dimension is then set to 50%, so the image is placed in the middle of the edge specified.
 */
export type ImageContentPositionString =
  | 'center'
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'top center'
  | 'top right'
  | 'top left'
  | 'right center'
  | 'right top'
  | 'right bottom'
  | 'bottom center'
  | 'bottom right'
  | 'bottom left'
  | 'left center'
  | 'left top'
  | 'left bottom';

/**
 * @docsMissing
 */
export type ImageContentPosition = ImageContentPositionString | ImageContentPositionObject;

/**
 * @deprecated The resize mode is deprecated in favor of `ImageContentFit` and `contentFit` prop.
 */
export enum ImageResizeMode {
  /**
   * The image will be resized such that the entire area of the view
   * is covered by the image, potentially clipping parts of the image.
   */
  COVER = 'cover',
  /**
   * The image will be resized such that it will be completely
   * visible, contained within the frame of the view.
   */
  CONTAIN = 'contain',
  /**
   * The image will be stretched to fill the entire frame of the view without clipping.
   * This may change the aspect ratio of the image, distorting it.
   *
   * @platform ios
   */
  STRETCH = 'stretch',
  /**
   * The image will be repeated to cover the frame of the view.
   * The image will keep its size and aspect ratio.
   */
  REPEAT = 'repeat',
  /**
   * The image will be scaled down such that it is completely visible,
   * if bigger than the area of the view. The image will not be scaled up.
   */
  CENTER = 'center',
}

export type ImageTransition = {
  duration?: number;
  timing?: ImageTransitionTiming;
  effect?: ImageTransitionEffect;
};

export enum ImageTransitionTiming {
  EASE_IN_OUT = 1,
  EASE_IN = 2,
  EASE_OUT = 3,
  LINEAR = 4,
}

export enum ImageTransitionEffect {
  NONE = 0,
  CROSS_DISOLVE = 1,
  FLIP_FROM_LEFT = 2,
  FLIP_FROM_RIGHT = 3,
  FLIP_FROM_TOP = 4,
  FLIP_FROM_BOTTOM = 5,
  CURL_UP = 6,
  CURL_DOWN = 7,
}

export enum ImageCacheType {
  NONE = 'none',
  DISK = 'disk',
  MEMORY = 'memory',
}

export enum ImageCachePolicy {
  NONE = 'none',
  DISK = 'disk',
  MEMORY = 'memory',
  MEMORY_AND_DISK = 'memoryAndDisk',
}

export enum ImagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
}

export type ImageLoadEventData = {
  cacheType: ImageCacheType;
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
