import { FilePrintOptions, FilePrintResult, OrientationType, PrintOptions, Printer } from './Print.types';
export { FilePrintOptions, FilePrintResult, OrientationType, PrintOptions, Printer };
/**
 * The orientation of the printed content.
 */
export declare const Orientation: OrientationType;
/**
 * Prints a document or HTML, on web this prints the HTML from the page.
 * > Note: On iOS, printing from HTML source doesn't support local asset URLs (due to `WKWebView`
 * > limitations). As a workaround you can use inlined base64-encoded strings.
 * > See [this comment](https://github.com/expo/expo/issues/7940#issuecomment-657111033) for more details.
 *
 * > Note: on iOS, when printing without providing a `PrintOptions.printerUrl` the `Promise` will be
 * > resolved once printing is started in the native print window and rejected if the window is closed without
 * > starting the print. On Android the `Promise` will be resolved immediately after displaying the native print window
 * > and won't be rejected if the window is closed without starting the print.
 * @param options A map defining what should be printed.
 * @return Resolves to an empty `Promise` if printing started.
 */
export declare function printAsync(options: PrintOptions): Promise<void>;
/**
 * Chooses a printer that can be later used in `printAsync`
 * @return A promise which fulfils with an object containing `name` and `url` of the selected printer.
 * @platform ios
 */
export declare function selectPrinterAsync(): Promise<Printer>;
/**
 * Prints HTML to PDF file and saves it to [app's cache directory](./filesystem/#filesystemcachedirectory).
 * On Web this method opens the print dialog.
 * @param options A map of print options.
 */
export declare function printToFileAsync(options?: FilePrintOptions): Promise<FilePrintResult>;
//# sourceMappingURL=Print.d.ts.map