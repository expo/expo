import { PrintOptions, SelectResult, OrientationConstant, FilePrintOptions, FilePrintResult } from './Print.types';
declare function printAsync(options: PrintOptions): Promise<void>;
declare function selectPrinterAsync(): Promise<SelectResult>;
declare function printToFileAsync(options?: FilePrintOptions): Promise<FilePrintResult>;
declare const _default: {
    Orientation: OrientationConstant;
    printAsync: typeof printAsync;
    selectPrinterAsync: typeof selectPrinterAsync;
    printToFileAsync: typeof printToFileAsync;
};
export default _default;
