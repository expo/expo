import { UnavailabilityError } from 'expo-modules-core';
import { Platform } from 'react-native';

import ExponentPrint from './ExponentPrint';
import {
  FilePrintOptions,
  FilePrintResult,
  OrientationType,
  PrintOptions,
  Printer,
} from './Print.types';

export { FilePrintOptions, FilePrintResult, OrientationType, PrintOptions, Printer };

// @needsAudit @docsMissing
/**
 * The orientation of the printed content.
 */
export const Orientation: OrientationType = ExponentPrint.Orientation;

// @needsAudit
/**
 * Prints a document or HTML, on web this prints the HTML from the page.
 * > Note: On iOS, printing from HTML source doesn't support local asset URLs (due to `WKWebView`
 * > limitations). As a workaround you can use inlined base64-encoded strings.
 * > See [this comment](https://github.com/expo/expo/issues/7940#issuecomment-657111033) for more details.
 * @param options A map defining what should be printed.
 * @return Resolves to an empty `Promise` if printing started.
 */
export async function printAsync(options: PrintOptions): Promise<void> {
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
  return await ExponentPrint.print(options);
}

// @needsAudit
/**
 * Chooses a printer that can be later used in `printAsync`
 * @return A promise which fulfils with an object containing `name` and `url` of the selected printer.
 * @platform ios
 */
export async function selectPrinterAsync(): Promise<Printer> {
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
export async function printToFileAsync(options: FilePrintOptions = {}): Promise<FilePrintResult> {
  return await ExponentPrint.printToFileAsync(options);
}
