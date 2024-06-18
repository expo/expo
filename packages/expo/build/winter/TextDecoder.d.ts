export declare class TextDecoder {
    private _encoding;
    private _ignoreBOM;
    private _errorMode;
    private _BOMseen;
    private _doNotFlush;
    private _decoder;
    constructor(label?: string, options?: {
        fatal?: boolean;
        ignoreBOM?: boolean;
    });
    get encoding(): string;
    get fatal(): boolean;
    get ignoreBOM(): boolean;
    decode(input?: ArrayBuffer | DataView, options?: {
        stream?: boolean;
    }): string;
    private serializeStream;
}
//# sourceMappingURL=TextDecoder.d.ts.map