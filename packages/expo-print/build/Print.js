import { Platform } from 'react-native';
import ExponentPrint from './ExponentPrint';
import { UnavailabilityError } from 'expo-errors';
const Orientation = ExponentPrint.Orientation;
async function printAsync(options) {
    if (Platform.OS === 'web') {
        return await ExponentPrint.print(options);
    }
    if (!options.uri && !options.html && (Platform.OS === 'ios' && !options.markupFormatterIOS)) {
        throw new Error('Must provide either `html` or `uri` to print');
    }
    if (options.uri && options.html) {
        throw new Error('Must provide exactly one of `html` and `uri` but both were specified');
    }
    return await ExponentPrint.print(options);
}
async function selectPrinterAsync() {
    if (ExponentPrint.selectPrinter) {
        return await ExponentPrint.selectPrinter();
    }
    throw new UnavailabilityError('Print', 'selectPrinterAsync');
}
async function printToFileAsync(options = {}) {
    return await ExponentPrint.printToFileAsync(options);
}
export default {
    Orientation,
    printAsync,
    selectPrinterAsync,
    printToFileAsync,
};
//# sourceMappingURL=Print.js.map