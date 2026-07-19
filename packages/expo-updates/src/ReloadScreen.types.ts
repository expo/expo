/**
 * Image source that can be used for the reload screen.
 */
export interface ReloadScreenImageSource {
  /**
   * URL to the image.
   */
  url?: string;

  /**
   * Width of the image in pixels.
   */
  width?: number;

  /**
   * Height of the image in pixels.
   */
  height?: number;

  /**
   * Scale factor of the image.
   */
  scale?: number;
}

/**
 * Configuration options for customizing the reload screen appearance.
 */
export interface ReloadScreenOptions {
  /**
   * Background color for the reload screen.
   * @default '#ffffff'
   */
  backgroundColor?: string;

  /**
   * Custom image to display on the reload screen.
   */
  image?: string | number | ReloadScreenImageSource;

  /**
   * How to resize the custom image to fit the screen.
   * @default 'contain'
   */
  imageResizeMode?: 'contain' | 'cover' | 'center' | 'stretch';

  /**
   * Whether to display the image at the full screen size.
   * @default false
   */
  imageFullScreen?: boolean;

  /**
   * Whether to fade out the reload screen when hiding.
   * @default false
   */
  fade?: boolean;

  /**
   * Configuration for the loading spinner.
   */
  spinner?: {
    /**
     * Whether to show the loading spinner.
     * @default true (if no image is provided), false (if image is provided)
     */
    enabled?: boolean;

    /**
     * Color of the loading spinner.
     */
    color?: string;

    /**
     * Size of the loading spinner.
     * @default 'medium'
     */
    size?: 'small' | 'medium' | 'large';
  };
}
