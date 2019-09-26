export var CryptoDigestAlgorithm;
(function (CryptoDigestAlgorithm) {
    /**
     * SHA1 is vulnerable and should not be used.
     * https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#SHA-1
     */
    CryptoDigestAlgorithm["SHA1"] = "SHA-1";
    CryptoDigestAlgorithm["SHA256"] = "SHA-256";
    CryptoDigestAlgorithm["SHA384"] = "SHA-384";
    CryptoDigestAlgorithm["SHA512"] = "SHA-512";
    /**
     * MD* is not supported on web.
     * message-digest algorithms shouldn't be used for creating secure digests.
     */
    CryptoDigestAlgorithm["MD2"] = "MD2";
    CryptoDigestAlgorithm["MD4"] = "MD4";
    CryptoDigestAlgorithm["MD5"] = "MD5";
})(CryptoDigestAlgorithm || (CryptoDigestAlgorithm = {}));
export var CryptoEncoding;
(function (CryptoEncoding) {
    CryptoEncoding["HEX"] = "hex";
    CryptoEncoding["BASE64"] = "base64";
})(CryptoEncoding || (CryptoEncoding = {}));
//# sourceMappingURL=Crypto.types.js.map