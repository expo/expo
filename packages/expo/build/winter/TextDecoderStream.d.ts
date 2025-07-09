export declare class TextDecoderStream extends TransformStream<Uint8Array | ArrayBuffer, string> {
    private decoder;
    constructor(label?: string, options?: TextDecoderOptions);
    get encoding(): string;
    get fatal(): boolean;
    get ignoreBOM(): boolean;
}
export declare class TextEncoderStream extends TransformStream {
    private encoder;
    constructor();
    get encoding(): string;
}
//# sourceMappingURL=TextDecoderStream.d.ts.map