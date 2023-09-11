/**
 * These values can be used to define how sessions work on iOS.
 * @platform ios
 */
export var FileSystemSessionType;
(function (FileSystemSessionType) {
    /**
     * Using this mode means that the downloading/uploading session on the native side will work even if the application is moved to background.
     * If the task completes while the application is in background, the Promise will be either resolved immediately or (if the application execution has already been stopped) once the app is moved to foreground again.
     * > Note: The background session doesn't fail if the server or your connection is down. Rather, it continues retrying until the task succeeds or is canceled manually.
     */
    FileSystemSessionType[FileSystemSessionType["BACKGROUND"] = 0] = "BACKGROUND";
    /**
     * Using this mode means that downloading/uploading session on the native side will be terminated once the application becomes inactive (e.g. when it goes to background).
     * Bringing the application to foreground again would trigger Promise rejection.
     */
    FileSystemSessionType[FileSystemSessionType["FOREGROUND"] = 1] = "FOREGROUND";
})(FileSystemSessionType || (FileSystemSessionType = {}));
export var FileSystemUploadType;
(function (FileSystemUploadType) {
    /**
     * The file will be sent as a request's body. The request can't contain additional data.
     */
    FileSystemUploadType[FileSystemUploadType["BINARY_CONTENT"] = 0] = "BINARY_CONTENT";
    /**
     * An [RFC 2387-compliant](https://www.ietf.org/rfc/rfc2387.txt) request body. The provided file will be encoded into HTTP request.
     * This request can contain additional data represented by [`UploadOptionsMultipart`](#uploadoptionsmultipart) type.
     */
    FileSystemUploadType[FileSystemUploadType["MULTIPART"] = 1] = "MULTIPART";
})(FileSystemUploadType || (FileSystemUploadType = {}));
/* eslint-enable */
/**
 * These values can be used to define how file system data is read / written.
 */
export var EncodingType;
(function (EncodingType) {
    /**
     * Standard encoding format.
     */
    EncodingType["UTF8"] = "utf8";
    /**
     * Binary, radix-64 representation.
     */
    EncodingType["Base64"] = "base64";
})(EncodingType || (EncodingType = {}));
/* eslint-enable */
//# sourceMappingURL=FileSystem.types.js.map