import { Platform } from 'react-native';
import { NativeModulesProxy } from 'expo-core';
const { ExponentPrint } = NativeModulesProxy;

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

const Orientation: OrientationConstant = ExponentPrint.Orientation

async function printAsync(options: PrintOptions): Promise<void> {
  if (!options.uri && !options.html && (Platform.OS === 'ios' && !options.markupFormatterIOS)) {
    throw new Error('Must provide either `html` or `uri` to print');
  }
  if (options.uri && options.html) {
    throw new Error('Must provide exactly one of `html` and `uri` but both were specified');
  }
  return ExponentPrint.print(options);
}

async function selectPrinterAsync(): Promise<SelectResult> {
  if (Platform.OS === 'ios') {
    return ExponentPrint.selectPrinter();
  } else {
    throw new Error('Selecting the printer in advance is not available on Android.');
  }
}

async function printToFileAsync(options: FilePrintOptions = {}): Promise<FilePrintResult> {
  return ExponentPrint.printToFileAsync(options);
}

export default {
  Orientation,
  printAsync,
  selectPrinterAsync,
  printToFileAsync,
};
