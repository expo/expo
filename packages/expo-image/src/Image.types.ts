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
  source?: ImageSource | number;
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
   * Determines how to resize the image when the frame doesn't match the raw image dimensions.
   * @default "cover"
   */
  resizeMode?: ImageResizeMode;
  /**
   * Object that describes how the image view should transition the contents on props change.
   * @platform ios
   */
  transition?: ImageTransition | null;
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
