declare class Crypto {
    getRandomValues<TArray extends ArrayBufferView>(values: TArray): TArray;
}
declare const webCrypto: Crypto;
export default webCrypto;
export declare function polyfillWebCrypto(): void;
//# sourceMappingURL=index.d.ts.map