import { UnavailabilityError } from 'expo-modules-core';
import { Platform } from 'react-native';
import ExponentPrint from './ExponentPrint';
let isPrinting = false;
// @needsAudit @docsMissing
/**
 * The orientation of the printed content.
 */
export const Orientation = ExponentPrint.Orientation;
// @needsAudit
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
export async function printAsync(options) {
    if (Platform.OS === 'web') {
        return await ExponentPrint.print(options);
    }
    if (!options.uri && !options.html && Platform.OS === 'ios' && !options.markupFormatterIOS) {
        throw new Error('Must provide either `html` or `uri` to print');
    }
    if (options.uri && options.html) {
        throw new Error('Must provide exactly one of `html` and `uri` but both were specified');
    }
    if (options.markupFormatterIOS !== undefined) {
        console.warn('The markupFormatterIOS option is deprecated. Use useMarkupFormatter instead.');
    }
    if (isPrinting) {
        throw new Error('Another print request is already in progress');
    }
    isPrinting = true;
    try {
        return await ExponentPrint.print(options);
    }
    finally {
        isPrinting = false;
    }
}
// @needsAudit
/**
 * Chooses a printer that can be later used in `printAsync`
 * @return A promise which fulfils with an object containing `name` and `url` of the selected printer.
 * @platform ios
 */
export async function selectPrinterAsync() {
    if (ExponentPrint.selectPrinter) {
        return await ExponentPrint.selectPrinter();
    }
    throw new UnavailabilityError('Print', 'selectPrinterAsync');
}
// @needsAudit
/**
 * Prints HTML to PDF file and saves it to [app's cache directory](./filesystem/#filesystemcachedirectory).
 * On Web this method opens the print dialog.
 * @param options A map of print options.
 */
export async function printToFileAsync(options = {}) {
    return await ExponentPrint.printToFileAsync(options);
}
//# sourceMappingURL=Print.js.map