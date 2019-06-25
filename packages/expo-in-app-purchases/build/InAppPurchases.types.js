export var IAPResponseCode;
(function (IAPResponseCode) {
    IAPResponseCode[IAPResponseCode["OK"] = 0] = "OK";
    IAPResponseCode[IAPResponseCode["USER_CANCELED"] = 1] = "USER_CANCELED";
    IAPResponseCode[IAPResponseCode["ERROR"] = 2] = "ERROR";
    IAPResponseCode[IAPResponseCode["DEFERRED"] = 3] = "DEFERRED";
})(IAPResponseCode || (IAPResponseCode = {}));
export var InAppPurchaseState;
(function (InAppPurchaseState) {
    InAppPurchaseState[InAppPurchaseState["PURCHASING"] = 0] = "PURCHASING";
    InAppPurchaseState[InAppPurchaseState["PURCHASED"] = 1] = "PURCHASED";
    InAppPurchaseState[InAppPurchaseState["FAILED"] = 2] = "FAILED";
    InAppPurchaseState[InAppPurchaseState["RESTORED"] = 3] = "RESTORED";
    InAppPurchaseState[InAppPurchaseState["DEFERRED"] = 4] = "DEFERRED";
})(InAppPurchaseState || (InAppPurchaseState = {}));
export var IAPErrorCode;
(function (IAPErrorCode) {
    IAPErrorCode[IAPErrorCode["UNKNOWN"] = 0] = "UNKNOWN";
    IAPErrorCode[IAPErrorCode["PAYMENT_INVALID"] = 1] = "PAYMENT_INVALID";
    IAPErrorCode[IAPErrorCode["SERVICE_DISCONNECTED"] = 2] = "SERVICE_DISCONNECTED";
    IAPErrorCode[IAPErrorCode["SERVICE_UNAVAILABLE"] = 3] = "SERVICE_UNAVAILABLE";
    IAPErrorCode[IAPErrorCode["SERVICE_TIMEOUT"] = 4] = "SERVICE_TIMEOUT";
    IAPErrorCode[IAPErrorCode["BILLING_UNAVAILABLE"] = 5] = "BILLING_UNAVAILABLE";
    IAPErrorCode[IAPErrorCode["ITEM_UNAVAILABLE"] = 6] = "ITEM_UNAVAILABLE";
    IAPErrorCode[IAPErrorCode["DEVELOPER_ERROR"] = 7] = "DEVELOPER_ERROR";
    IAPErrorCode[IAPErrorCode["ITEM_ALREADY_OWNED"] = 8] = "ITEM_ALREADY_OWNED";
    IAPErrorCode[IAPErrorCode["ITEM_NOT_OWNED"] = 9] = "ITEM_NOT_OWNED";
    IAPErrorCode[IAPErrorCode["CLOUD_SERVICE"] = 10] = "CLOUD_SERVICE";
    IAPErrorCode[IAPErrorCode["PRIVACY_UNACKNOWLEDGED"] = 11] = "PRIVACY_UNACKNOWLEDGED";
    IAPErrorCode[IAPErrorCode["UNAUTHORIZED_REQUEST"] = 12] = "UNAUTHORIZED_REQUEST";
    IAPErrorCode[IAPErrorCode["INVALID_IDENTIFIER"] = 13] = "INVALID_IDENTIFIER";
    IAPErrorCode[IAPErrorCode["MISSING_PARAMS"] = 14] = "MISSING_PARAMS";
})(IAPErrorCode || (IAPErrorCode = {}));
export var IAPItemType;
(function (IAPItemType) {
    IAPItemType[IAPItemType["PURCHASE"] = 0] = "PURCHASE";
    IAPItemType[IAPItemType["SUBSCRIPTION"] = 1] = "SUBSCRIPTION";
})(IAPItemType || (IAPItemType = {}));
//# sourceMappingURL=InAppPurchases.types.js.map