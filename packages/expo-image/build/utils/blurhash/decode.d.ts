export declare const isBlurhashValid: (blurhash: string) => {
    result: boolean;
    errorReason?: string;
};
declare const decode: (blurhash: string, width: number, height: number, punch?: number) => Uint8ClampedArray<ArrayBuffer>;
export default decode;
//# sourceMappingURL=decode.d.ts.map