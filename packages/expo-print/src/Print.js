// @flow

import { Platform } from 'react-native';
import ExponentPrint from './ExponentPrint';

type PrintOptions = {
  uri: string,
  html?: string,
  printerUrl?: string,
  markupFormatterIOS?: string,
};

type SelectResult = {
  name: string,
  url: string,
};

type OrientationConstant = {
  portrait: string,
  landscape: string,
};

type FilePrintOptions = {
  html?: string,
  width?: number,
  height?: number,
  padding?: {
    top: number,
    right: number,
    bottom: number,
    left: number,
  },
};

type FilePrintResult = {
  uri: string,
  numberOfPages: number,
};

export const Orientation: OrientationConstant = ExponentPrint.Orientation;

export async function printAsync(options: PrintOptions): Promise<void> {
  if (Platform.OS === 'web') {
    return ExponentPrint.print(options);
  }
  if (!options.uri && !options.html && (Platform.OS === 'ios' && !options.markupFormatterIOS)) {
    throw new Error('Must provide either `html` or `uri` to print');
  }
  if (options.uri && options.html) {
    throw new Error('Must provide exactly one of `html` and `uri` but both were specified');
  }
  return ExponentPrint.print(options);
}

export async function selectPrinterAsync(): Promise<SelectResult> {
  if (ExponentPrint.selectPrinter) {
    return ExponentPrint.selectPrinter();
  }

  throw new Error(`Selecting the printer in advance is not available on ${Platform.OS}`);
}

export async function printToFileAsync(options: FilePrintOptions = {}): Promise<FilePrintResult> {
  return ExponentPrint.printToFileAsync(options);
}
