export interface RenderToImageOptions {
  /**
   * Font family name.
   * @default system default
   */
  fontFamily?: string;
  /**
   * Size of the font.
   * @default 24
   */
  size?: number;
  /**
   * Font color
   * @default 'black'
   */
  color?: string;
}

export interface RenderToImageResult {
  /**
   * The file uri to the image.
   */
  uri: string;
  /**
   * Image width.
   */
  width: number;
  /**
   * Image height.
   */
  height: number;
}
