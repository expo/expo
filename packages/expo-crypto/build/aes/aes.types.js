/**
 * AES key sizes in bits.
 */
export var AESKeySize;
(function (AESKeySize) {
    /** 128-bit AES key */
    AESKeySize[AESKeySize["AES128"] = 128] = "AES128";
    /** 192-bit AES key. It is unsupported on Web.
     * @platform apple
     * @platform android
     */
    AESKeySize[AESKeySize["AES192"] = 192] = "AES192";
    /** 256-bit AES key */
    AESKeySize[AESKeySize["AES256"] = 256] = "AES256";
})(AESKeySize || (AESKeySize = {}));
//# sourceMappingURL=aes.types.js.map