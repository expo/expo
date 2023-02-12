export var PermissionStatus;
(function (PermissionStatus) {
    /**
     * User has granted the permission.
     */
    PermissionStatus["GRANTED"] = "granted";
    /**
     * User hasn't granted or denied the permission yet.
     */
    PermissionStatus["UNDETERMINED"] = "undetermined";
    /**
     * User has denied the permission.
     */
    PermissionStatus["DENIED"] = "denied";
})(PermissionStatus || (PermissionStatus = {}));
//# sourceMappingURL=PermissionsInterface.js.map