export declare type PrintOptions = {
    uri: string;
    html?: string;
    printerUrl?: string;
    markupFormatterIOS?: string;
};
export declare type SelectResult = {
    name: string;
    url: string;
};
export declare type OrientationConstant = {
    portrait: string;
    landscape: string;
};
export declare type FilePrintOptions = {
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
export declare type FilePrintResult = {
    uri: string;
    numberOfPages: number;
};
