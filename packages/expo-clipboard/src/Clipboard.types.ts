// @needsAudit
export type GetImageOptions = {
  /**
   * The format of the clipboard image to be converted to.
   */
  format: 'png' | 'jpeg';
  /**
   * Specify the quality of the returned image, between `0` and `1`. Defaults to `1` (highest quality).
   * Applicable only when `format` is set to `jpeg`, ignored otherwise.
   * @default 1
   */
  jpegQuality?: number;
};

// @needsAudit
export type ClipboardImage = {
  /**
   * A Base64-encoded string of the image data. Its format is dependent on the `format` option.
   * You can use it directly as the source of an `Image` element.
   *
   * > **NOTE:** The string is already prepended with `data:image/png;base64,` or `data:image/jpeg;base64,` prefix.
   * @example
   * ```ts
   * <Image
   *   source={{ uri: clipboardImage.data }}
   *   style={{ width: 200, height: 200 }}
   * />
   * ```
   */
  data: string;
  /**
   * Dimensions (`width` and `height`) of the image pasted from clipboard.
   */
  size: {
    width: number;
    height: number;
  };
};

/**
 * Type used to define what type of data is stored in the clipboard.
 */
export enum ContentType {
  PLAIN_TEXT = 'plain-text',
  HTML = 'html',
  IMAGE = 'image',
  /**
   * @platform iOS
   */
  URL = 'url',
}

/**
 * Type used to determine string format stored in the clipboard.
 */
export enum StringFormat {
  PLAIN_TEXT = 'plainText',
  HTML = 'html',
}

export type GetStringOptions = {
  /**
   * The target format of the clipboard string to be converted to, if possible.
   *
   * @default StringFormat.PLAIN_TEXT
   */
  preferredFormat?: StringFormat;
};

export type SetStringOptions = {
  /**
   * The input format of the provided string.
   * Adjusting this option can help other applications interpret copied string properly.
   *
   * @default StringFormat.PLAIN_TEXT
   */
  inputFormat?: StringFormat;
};

export type AcceptedContentType = 'plain-text' | 'image' | 'url' | 'html';

export type CornerStyleType = 'dynamic' | 'fixed' | 'capsule' | 'large' | 'medium' | 'small';

export type DisplayModeType = 'iconAndLabel' | 'iconOnly' | 'labelOnly';

export type PasteEventPayload = TextPasteEvent | ImagePasteEvent;

export type TextPasteEvent = {
  text: string;
  type: 'text';
};

export type ImagePasteEvent = {
  type: 'image';
} & ClipboardImage;
