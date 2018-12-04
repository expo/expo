import { Platform } from 'react-native';
import ExponentPrint from './ExponentPrint';
import { UnavailabilityError } from 'expo-errors';
import {
  PrintOptions,
  SelectResult,
  OrientationConstant,
  FilePrintOptions,
  FilePrintResult,
} from './Print.types';

const Orientation: OrientationConstant = ExponentPrint.Orientation;

async function printAsync(options: PrintOptions): Promise<void> {
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

async function selectPrinterAsync(): Promise<SelectResult> {
  if (ExponentPrint.selectPrinter) {
    return await ExponentPrint.selectPrinter();
  }

  throw new UnavailabilityError('Print', 'selectPrinterAsync');
}

async function printToFileAsync(options: FilePrintOptions = {}): Promise<FilePrintResult> {
  return await ExponentPrint.printToFileAsync(options);
}

export default {
  Orientation,
  printAsync,
  selectPrinterAsync,
  printToFileAsync,
};
