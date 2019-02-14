export var CryptoDigestAlgorithm;
(function (CryptoDigestAlgorithm) {
    CryptoDigestAlgorithm["SHA1"] = "SHA-1"; /* (but don't use this in cryptographic applications) */
    CryptoDigestAlgorithm["SHA256"] = "SHA-256";
    CryptoDigestAlgorithm["SHA384"] = "SHA-384";
    CryptoDigestAlgorithm["SHA512"] = "SHA-512";
    /* Not supported on web */
    CryptoDigestAlgorithm["MD2"] = "MD2";
    CryptoDigestAlgorithm["MD4"] = "MD4";
    CryptoDigestAlgorithm["MD5"] = "MD5";
})(CryptoDigestAlgorithm || (CryptoDigestAlgorithm = {}));
export var CryptoEncoding;
(function (CryptoEncoding) {
    CryptoEncoding["HEX"] = "hex";
    CryptoEncoding["Base64"] = "base64";
})(CryptoEncoding || (CryptoEncoding = {}));
//# sourceMappingURL=Crypto.types.js.map