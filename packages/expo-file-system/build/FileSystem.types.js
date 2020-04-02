export var FileSystemSessionType;
(function (FileSystemSessionType) {
    /*
     * Using this mode means that the downloading/uploading session on the native side will work even if the application is moved to the `background`.
     *
     * If the task completes when the application is in the `background`, the promise might be resolved immediately.
     * However, javascript execution will be stopped after a couple of seconds and it will be resumed when the application is moved to the `foreground` again.
     */
    FileSystemSessionType[FileSystemSessionType["BACKGROUND"] = 0] = "BACKGROUND";
    /*
     * Using this mode means that downloading/uploading session on the native side will be killed once the application becomes inactive (e.g. when it goes to `background`).
     * Bringing the application to the `foreground` again would trigger promise rejection.
     */
    FileSystemSessionType[FileSystemSessionType["FOREGROUND"] = 1] = "FOREGROUND";
})(FileSystemSessionType || (FileSystemSessionType = {}));
export var EncodingType;
(function (EncodingType) {
    EncodingType["UTF8"] = "utf8";
    EncodingType["Base64"] = "base64";
})(EncodingType || (EncodingType = {}));
export var FileSystemHttpMethods;
(function (FileSystemHttpMethods) {
    FileSystemHttpMethods[FileSystemHttpMethods["POST"] = 0] = "POST";
    FileSystemHttpMethods[FileSystemHttpMethods["PUT"] = 1] = "PUT";
    FileSystemHttpMethods[FileSystemHttpMethods["PATCH"] = 2] = "PATCH";
})(FileSystemHttpMethods || (FileSystemHttpMethods = {}));
//# sourceMappingURL=FileSystem.types.js.map