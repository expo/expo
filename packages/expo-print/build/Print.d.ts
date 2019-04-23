import { PrintOptions, Printer, OrientationType, FilePrintOptions, FilePrintResult } from './Print.types';
export { Printer, FilePrintOptions, FilePrintResult, PrintOptions, OrientationType, };
export declare const Orientation: OrientationType;
export declare function printAsync(options: PrintOptions): Promise<void>;
export declare function selectPrinterAsync(): Promise<Printer>;
export declare function printToFileAsync(options?: FilePrintOptions): Promise<FilePrintResult>;
