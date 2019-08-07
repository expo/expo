import { Platform } from 'react-native';
import ExponentPrint from './ExponentPrint';
import { UnavailabilityError } from '@unimodules/core';
import {
  PrintOptions,
  Printer,
  OrientationType,
  FilePrintOptions,
  FilePrintResult,
} from './Print.types';

export {
  Printer,
  FilePrintOptions,
  FilePrintResult,
  PrintOptions,
  OrientationType,
};

export const Orientation: OrientationType = ExponentPrint.Orientation;

export async function printAsync(options: PrintOptions): Promise<void> {
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

export async function selectPrinterAsync(): Promise<Printer> {
  if (ExponentPrint.selectPrinter) {
    return await ExponentPrint.selectPrinter();
  }

  throw new UnavailabilityError('Print', 'selectPrinterAsync');
}

export async function printToFileAsync(options: FilePrintOptions = {}): Promise<FilePrintResult> {
  return await ExponentPrint.printToFileAsync(options);
}
