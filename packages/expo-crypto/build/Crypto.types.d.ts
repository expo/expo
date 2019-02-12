export declare enum Algorithm {
    sha1 = "SHA-1",
    sha256 = "SHA-256",
    sha384 = "SHA-384",
    sha512 = "SHA-512",
    md2 = "MD2",
    md4 = "MD4",
    md5 = "MD5"
}
export declare enum Encoding {
    hex = "hex",
    base64 = "base64"
}
export declare type DigestOptions = {
    encoding: Encoding;
};
