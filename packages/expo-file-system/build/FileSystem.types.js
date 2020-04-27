export var FileSystemSessionType;
(function (FileSystemSessionType) {
    /*
     * Using this mode means that the downloading/uploading session on the native side will work even if the application is moved to background.
     *
     * If the task completes while the application is in background, the Promise will be either resolved immediately or (if the application execution has already been stopped) once the app is moved to foreground again.
     */
    FileSystemSessionType[FileSystemSessionType["BACKGROUND"] = 0] = "BACKGROUND";
    /*
     * Using this mode means that downloading/uploading session on the native side will be terminated once the application becomes inactive (e.g. when it goes to background).
     * Bringing the application to foreground again would trigger Promise rejection.
     */
    FileSystemSessionType[FileSystemSessionType["FOREGROUND"] = 1] = "FOREGROUND";
})(FileSystemSessionType || (FileSystemSessionType = {}));
export var EncodingType;
(function (EncodingType) {
    EncodingType["UTF8"] = "utf8";
    EncodingType["Base64"] = "base64";
})(EncodingType || (EncodingType = {}));
//# sourceMappingURL=FileSystem.types.js.map