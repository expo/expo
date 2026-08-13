export declare class TextDecoder {
    private readonly _state;
    constructor(label?: string, options?: {
        fatal?: boolean;
        ignoreBOM?: boolean;
    });
    get encoding(): string;
    get fatal(): boolean;
    get ignoreBOM(): boolean;
    decode(input?: ArrayBuffer | ArrayBufferView, options?: {
        stream?: boolean;
    }): string;
}
//# sourceMappingURL=TextDecoder.d.ts.map