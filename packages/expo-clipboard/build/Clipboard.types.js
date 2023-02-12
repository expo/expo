/**
 * Type used to define what type of data is stored in the clipboard.
 */
export var ContentType;
(function (ContentType) {
    ContentType["PLAIN_TEXT"] = "plain-text";
    ContentType["HTML"] = "html";
    ContentType["IMAGE"] = "image";
    /**
     * @platform iOS
     */
    ContentType["URL"] = "url";
})(ContentType || (ContentType = {}));
/**
 * Type used to determine string format stored in the clipboard.
 */
export var StringFormat;
(function (StringFormat) {
    StringFormat["PLAIN_TEXT"] = "plainText";
    StringFormat["HTML"] = "html";
})(StringFormat || (StringFormat = {}));
//# sourceMappingURL=Clipboard.types.js.map