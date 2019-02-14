export declare enum CryptoDigestAlgorithm {
    SHA1 = "SHA-1",
    SHA256 = "SHA-256",
    SHA384 = "SHA-384",
    SHA512 = "SHA-512",
    MD2 = "MD2",
    MD4 = "MD4",
    MD5 = "MD5"
}
export declare enum CryptoEncoding {
    HEX = "hex",
    Base64 = "base64"
}
export declare type CryptoDigestOptions = {
    encoding: CryptoEncoding;
};
