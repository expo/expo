import { NativeModulesProxy } from '@unimodules/core';
export var IosAlertStyle;
(function (IosAlertStyle) {
    IosAlertStyle[IosAlertStyle["NONE"] = 0] = "NONE";
    IosAlertStyle[IosAlertStyle["BANNER"] = 1] = "BANNER";
    IosAlertStyle[IosAlertStyle["ALERT"] = 2] = "ALERT";
})(IosAlertStyle || (IosAlertStyle = {}));
export var IosAllowsPreviews;
(function (IosAllowsPreviews) {
    IosAllowsPreviews[IosAllowsPreviews["NEVER"] = 0] = "NEVER";
    IosAllowsPreviews[IosAllowsPreviews["ALWAYS"] = 1] = "ALWAYS";
    IosAllowsPreviews[IosAllowsPreviews["WHEN_AUTHENTICATED"] = 2] = "WHEN_AUTHENTICATED";
})(IosAllowsPreviews || (IosAllowsPreviews = {}));
export var IosAuthorizationStatus;
(function (IosAuthorizationStatus) {
    IosAuthorizationStatus[IosAuthorizationStatus["NOT_DETERMINED"] = 0] = "NOT_DETERMINED";
    IosAuthorizationStatus[IosAuthorizationStatus["DENIED"] = 1] = "DENIED";
    IosAuthorizationStatus[IosAuthorizationStatus["AUTHORIZED"] = 2] = "AUTHORIZED";
    IosAuthorizationStatus[IosAuthorizationStatus["PROVISIONAL"] = 3] = "PROVISIONAL";
})(IosAuthorizationStatus || (IosAuthorizationStatus = {}));
export var AndroidImportance;
(function (AndroidImportance) {
    AndroidImportance[AndroidImportance["UNSPECIFIED"] = -1000] = "UNSPECIFIED";
    AndroidImportance[AndroidImportance["NONE"] = 0] = "NONE";
    AndroidImportance[AndroidImportance["MIN"] = 1] = "MIN";
    AndroidImportance[AndroidImportance["LOW"] = 2] = "LOW";
    AndroidImportance[AndroidImportance["DEEFAULT"] = 3] = "DEEFAULT";
    AndroidImportance[AndroidImportance["HIGH"] = 4] = "HIGH";
    AndroidImportance[AndroidImportance["MAX"] = 5] = "MAX";
})(AndroidImportance || (AndroidImportance = {}));
export var AndroidInterruptionFilter;
(function (AndroidInterruptionFilter) {
    AndroidInterruptionFilter[AndroidInterruptionFilter["UNKNOWN"] = 0] = "UNKNOWN";
    AndroidInterruptionFilter[AndroidInterruptionFilter["ALL"] = 1] = "ALL";
    AndroidInterruptionFilter[AndroidInterruptionFilter["PRIORITY"] = 2] = "PRIORITY";
    AndroidInterruptionFilter[AndroidInterruptionFilter["NONE"] = 3] = "NONE";
    AndroidInterruptionFilter[AndroidInterruptionFilter["ALARMS"] = 4] = "ALARMS";
})(AndroidInterruptionFilter || (AndroidInterruptionFilter = {}));
export default NativeModulesProxy.ExpoNotificationPermissionsModule;
//# sourceMappingURL=NotificationPermissionsModule.js.map