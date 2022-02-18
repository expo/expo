// @needsAudit
/**
 * [`Cryptographic hash function`](https://developer.mozilla.org/en-US/docs/Glossary/Cryptographic_hash_function)
 */
export var CryptoDigestAlgorithm;
(function (CryptoDigestAlgorithm) {
    /**
     * `160` bits.
     */
    CryptoDigestAlgorithm["SHA1"] = "SHA-1";
    /**
     * `256` bits. Collision Resistant.
     */
    CryptoDigestAlgorithm["SHA256"] = "SHA-256";
    /**
     * `384` bits. Collision Resistant.
     */
    CryptoDigestAlgorithm["SHA384"] = "SHA-384";
    /**
     * `512` bits. Collision Resistant.
     */
    CryptoDigestAlgorithm["SHA512"] = "SHA-512";
    /**
     * `128` bits.
     * @platform ios
     */
    CryptoDigestAlgorithm["MD2"] = "MD2";
    /**
     * `128` bits.
     * @platform ios
     */
    CryptoDigestAlgorithm["MD4"] = "MD4";
    /**
     * `128` bits.
     * @platform android
     * @platform ios
     */
    CryptoDigestAlgorithm["MD5"] = "MD5";
})(CryptoDigestAlgorithm || (CryptoDigestAlgorithm = {}));
// @needsAudit
export var CryptoEncoding;
(function (CryptoEncoding) {
    CryptoEncoding["HEX"] = "hex";
    /**
     * Has trailing padding. Does not wrap lines. Does not have a trailing newline.
     */
    CryptoEncoding["BASE64"] = "base64";
})(CryptoEncoding || (CryptoEncoding = {}));
//# sourceMappingURL=Crypto.types.js.map