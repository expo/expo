import { UnavailabilityError } from '@unimodules/core';
import { Platform } from 'react-native';
import ExponentPrint from './ExponentPrint';
export const Orientation = ExponentPrint.Orientation;
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
    return await ExponentPrint.print(options);
}
export async function selectPrinterAsync() {
    if (ExponentPrint.selectPrinter) {
        return await ExponentPrint.selectPrinter();
    }
    throw new UnavailabilityError('Print', 'selectPrinterAsync');
}
export async function printToFileAsync(options = {}) {
    return await ExponentPrint.printToFileAsync(options);
}
//# sourceMappingURL=Print.js.map