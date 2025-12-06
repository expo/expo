/**
 * AES key sizes in bits.
 */
export var KeySize;
(function (KeySize) {
    /** 128-bit AES key */
    KeySize[KeySize["AES128"] = 128] = "AES128";
    /** 192-bit AES key. It is unsupported on Web.
     * @platform ios
     * @platform android
     */
    KeySize[KeySize["AES192"] = 192] = "AES192";
    /** 256-bit AES key */
    KeySize[KeySize["AES256"] = 256] = "AES256";
})(KeySize || (KeySize = {}));
//# sourceMappingURL=aes.types.js.map