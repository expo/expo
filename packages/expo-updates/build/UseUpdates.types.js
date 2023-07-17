/**
 * The different possible types of updates.
 * Currently, the only supported type is `UpdateInfoType.NEW`, indicating a new update that can be downloaded and launched
 * on the device.
 * In future, other types of updates may be added to this list.
 */
export var UpdateInfoType;
(function (UpdateInfoType) {
    /**
     * This is the type for new updates found on or downloaded from the update server, that are launchable on the device.
     */
    UpdateInfoType["NEW"] = "new";
})(UpdateInfoType || (UpdateInfoType = {}));
//# sourceMappingURL=UseUpdates.types.js.map