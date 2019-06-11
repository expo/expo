export var ResponseCode;
(function (ResponseCode) {
    ResponseCode[ResponseCode["OK"] = 0] = "OK";
    ResponseCode[ResponseCode["USER_CANCELED"] = 1] = "USER_CANCELED";
    ResponseCode[ResponseCode["ERROR"] = 2] = "ERROR";
    ResponseCode[ResponseCode["DEFERRED"] = 3] = "DEFERRED";
})(ResponseCode || (ResponseCode = {}));
export var ErrorCode;
(function (ErrorCode) {
    ErrorCode[ErrorCode["UNKNOWN"] = 0] = "UNKNOWN";
    ErrorCode[ErrorCode["PAYMENT_INVALID"] = 1] = "PAYMENT_INVALID";
    ErrorCode[ErrorCode["SERVICE_DISCONNECTED"] = 2] = "SERVICE_DISCONNECTED";
    ErrorCode[ErrorCode["SERVICE_UNAVAILABLE"] = 3] = "SERVICE_UNAVAILABLE";
    ErrorCode[ErrorCode["SERVICE_TIMEOUT"] = 4] = "SERVICE_TIMEOUT";
    ErrorCode[ErrorCode["BILLING_UNAVAILABLE"] = 5] = "BILLING_UNAVAILABLE";
    ErrorCode[ErrorCode["ITEM_UNAVAILABLE"] = 6] = "ITEM_UNAVAILABLE";
    ErrorCode[ErrorCode["DEVELOPER_ERROR"] = 7] = "DEVELOPER_ERROR";
    ErrorCode[ErrorCode["ITEM_ALREADY_OWNED"] = 8] = "ITEM_ALREADY_OWNED";
    ErrorCode[ErrorCode["ITEM_NOT_OWNED"] = 9] = "ITEM_NOT_OWNED";
    ErrorCode[ErrorCode["CLOUD_SERVICE"] = 10] = "CLOUD_SERVICE";
    ErrorCode[ErrorCode["PRIVACY_UNACKNOWLEDGED"] = 11] = "PRIVACY_UNACKNOWLEDGED";
    ErrorCode[ErrorCode["UNATHORIZED_REQUEST"] = 12] = "UNATHORIZED_REQUEST";
    ErrorCode[ErrorCode["INVALID_IDENTIFIER"] = 13] = "INVALID_IDENTIFIER";
    ErrorCode[ErrorCode["MISSING_PARAMS"] = 14] = "MISSING_PARAMS";
})(ErrorCode || (ErrorCode = {}));
//# sourceMappingURL=InAppPurchases.types.js.map