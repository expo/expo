declare type PrintOptions = {
    uri: string;
    html?: string;
    printerUrl?: string;
    markupFormatterIOS?: string;
};
declare type SelectResult = {
    name: string;
    url: string;
};
declare type OrientationConstant = {
    portrait: string;
    landscape: string;
};
declare type FilePrintOptions = {
    html?: string;
    width?: number;
    height?: number;
    padding?: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
};
declare type FilePrintResult = {
    uri: string;
    numberOfPages: number;
};
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
