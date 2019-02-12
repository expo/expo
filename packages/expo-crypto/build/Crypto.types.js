export var Algorithm;
(function (Algorithm) {
    Algorithm["sha1"] = "SHA-1"; /* (but don't use this in cryptographic applications) */
    Algorithm["sha256"] = "SHA-256";
    Algorithm["sha384"] = "SHA-384";
    Algorithm["sha512"] = "SHA-512";
    Algorithm["md2"] = "MD2";
    Algorithm["md4"] = "MD4";
    Algorithm["md5"] = "MD5";
})(Algorithm || (Algorithm = {}));
export var Encoding;
(function (Encoding) {
    Encoding["hex"] = "hex";
    Encoding["base64"] = "base64";
})(Encoding || (Encoding = {}));
//# sourceMappingURL=Crypto.types.js.map