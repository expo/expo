import { Platform } from 'react-native';
import { NativeModulesProxy } from 'expo-core';
const { ExponentPrint } = NativeModulesProxy;
const Orientation = ExponentPrint.Orientation;
async function printAsync(options) {
    if (!options.uri && !options.html && (Platform.OS === 'ios' && !options.markupFormatterIOS)) {
        throw new Error('Must provide either `html` or `uri` to print');
    }
    if (options.uri && options.html) {
        throw new Error('Must provide exactly one of `html` and `uri` but both were specified');
    }
    return ExponentPrint.print(options);
}
async function selectPrinterAsync() {
    if (Platform.OS === 'ios') {
        return ExponentPrint.selectPrinter();
    }
    else {
        throw new Error('Selecting the printer in advance is not available on Android.');
    }
}
async function printToFileAsync(options = {}) {
    return ExponentPrint.printToFileAsync(options);
}
export default {
    Orientation,
    printAsync,
    selectPrinterAsync,
    printToFileAsync,
};
//# sourceMappingURL=Print.js.map