// @needsAudit
export type PrintOptions = {
  /**
   * URI of a PDF file to print. Remote, local (ex. selected via `DocumentPicker`) or base64 data URI
   * starting with `data:application/pdf;base64,`. This only supports PDF, not other types of
   * document (e.g. images).
   * @platform android
   * @platform ios
   */
  uri?: string;
  /**
   * HTML string to print.
   * @platform android
   * @platform ios
   */
  html?: string;
  /**
   * Width of the single page in pixels. Defaults to `612` which is a width of US Letter paper
   * format with 72 PPI. **Available only with `html` option.**
   */
  width?: number;
  /**
   * Height of the single page in pixels. Defaults to `792` which is a height of US Letter paper
   * format with 72 PPI. **Available only with `html` option.**
   */
  height?: number;
  /**
   * URL of the printer to use. Returned from `selectPrinterAsync`.
   * @platform ios
   */
  printerUrl?: string;
  /**
   * Alternative to default option that uses [UIMarkupTextPrintFormatter](https://developer.apple.com/documentation/uikit/uimarkuptextprintformatter)
   * instead of WebView, but it doesn't display images.
   * @platform ios
   */
  useMarkupFormatter?: boolean;
  /**
   * @deprecated
   * This argument is deprecated, use `useMarkupFormatter` instead.
   * Might be removed in the future releases.
   * @platform ios
   */
  markupFormatterIOS?: string;
  /**
   * The orientation of the printed content, `Print.Orientation.portrait`
   * or `Print.Orientation.landscape`.
   * @platform ios
   */
  orientation?: OrientationType['portrait'] | OrientationType['landscape'];
  /**
   * Page margins for the printed document.
   * @platform ios
   */
  margins?: PageMargins;
  /**
   * Paper size, in points (1/72 inch), that the print job prefers. For example,
   * `{ width: 432, height: 288 }` selects 4 x 6 inch paper on a printer that reports it. The order
   * of `width` and `height` does not matter. The page still scales to fit the selected paper. The
   * user can still select a different paper.
   *
   * On iOS, the job selects the printer's paper that best fits this size, with
   * [`UIPrintPaper.bestPaper(forPageSize:withPapersFrom:)`](https://developer.apple.com/documentation/uikit/uiprintpaper/bestpaper(forpagesize:withpapersfrom:)).
   * In the print dialog, this happens when the user selects a printer. With `printerUrl`, the job
   * prints on that paper without the dialog. The system selects the paper before the user selects
   * a printer, after the user switches to another printer, or when this option is not set.
   *
   * On Android, the option selects the
   * [standard paper size](https://developer.android.com/reference/android/print/PrintAttributes.MediaSize)
   * that best fits this size. That is the paper within one point of this size, such as A4 for
   * `{ width: 595, height: 842 }`, or else the smallest paper that contains this size. If the
   * printer does not have that paper, the print dialog selects the printer's default paper.
   * @platform android
   * @platform ios
   */
  preferredPaperSize?: PaperSize;
};

// @needsAudit
export type Printer = {
  /**
   * Name of the printer.
   */
  name: string;
  /**
   * URL of the printer.
   */
  url: string;
};

// @needsAudit
/**
 * The possible values of orientation for the printed content.
 */
export interface OrientationType {
  portrait: string;
  landscape: string;
}

// @needsAudit
export type PageMargins = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

// @needsAudit
export type PaperSize = {
  /**
   * Paper width in points (1/72 inch).
   */
  width: number;
  /**
   * Paper height in points (1/72 inch).
   */
  height: number;
};

// @docsMissing
export type FilePrintOptions = {
  /**
   * HTML string to print into PDF file.
   */
  html?: string;
  /**
   * Alternative to default option that uses [UIMarkupTextPrintFormatter](https://developer.apple.com/documentation/uikit/uimarkuptextprintformatter)
   * instead of WebView, but it doesn't display images.
   * @platform ios
   */
  useMarkupFormatter?: boolean;
  /**
   * Width of the single page in pixels. Defaults to `612` which is a width of US Letter paper
   * format with 72 PPI.
   */
  width?: number;
  /**
   * Height of the single page in pixels. Defaults to `792` which is a height of US Letter paper
   * format with 72 PPI.
   */
  height?: number;
  /**
   * Page margins for the printed document.
   * @platform ios
   */
  margins?: PageMargins;
  /**
   * Whether to include base64 encoded string of the file in the returned object.
   */
  base64?: boolean;
  /**
   * The text zoom of the page in percent. The default is 100.
   * @platform android
   */
  textZoom?: number;
};

// @needsAudit
export type FilePrintResult = {
  /**
   * A URI to the printed PDF file.
   */
  uri: string;
  /**
   * Number of pages that were needed to render given content.
   */
  numberOfPages: number;
  /**
   * Base64 encoded string containing the data of the PDF file. **Available only if `base64`
   * option is truthy**. It doesn't include data URI prefix `data:application/pdf;base64,`.
   */
  base64?: string;
};
