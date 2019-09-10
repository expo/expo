import { FilePrintOptions, FilePrintResult, OrientationType, PrintOptions, Printer } from './Print.types';
export { FilePrintOptions, FilePrintResult, OrientationType, PrintOptions, Printer };
export declare const Orientation: OrientationType;
export declare function printAsync(options: PrintOptions): Promise<void>;
export declare function selectPrinterAsync(): Promise<Printer>;
export declare function printToFileAsync(options?: FilePrintOptions): Promise<FilePrintResult>;
