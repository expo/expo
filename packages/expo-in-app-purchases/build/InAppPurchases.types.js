// @needsAudit
export var IAPResponseCode;
(function (IAPResponseCode) {
    /**
     * Response returned successfully.
     */
    IAPResponseCode[IAPResponseCode["OK"] = 0] = "OK";
    /**
     * User canceled the purchase.
     */
    IAPResponseCode[IAPResponseCode["USER_CANCELED"] = 1] = "USER_CANCELED";
    /**
     * An error occurred. Check the `errorCode` for additional details.
     */
    IAPResponseCode[IAPResponseCode["ERROR"] = 2] = "ERROR";
    /**
     * Purchase was deferred.
     * @platform ios
     */
    IAPResponseCode[IAPResponseCode["DEFERRED"] = 3] = "DEFERRED";
})(IAPResponseCode || (IAPResponseCode = {}));
// @needsAudit
export var InAppPurchaseState;
(function (InAppPurchaseState) {
    /**
     * The transaction is being processed.
     */
    InAppPurchaseState[InAppPurchaseState["PURCHASING"] = 0] = "PURCHASING";
    /**
     * The App Store successfully processed payment.
     */
    InAppPurchaseState[InAppPurchaseState["PURCHASED"] = 1] = "PURCHASED";
    /**
     * The transaction failed.
     */
    InAppPurchaseState[InAppPurchaseState["FAILED"] = 2] = "FAILED";
    /**
     * This transaction restores content previously purchased by the user. Read the
     * `originalTransaction` properties to obtain information about the original purchase.
     * @platform ios
     */
    InAppPurchaseState[InAppPurchaseState["RESTORED"] = 3] = "RESTORED";
    /**
     * The transaction has been received, but its final status is pending external
     * action such as the Ask to Buy feature where a child initiates a new purchase and has to wait
     * for the family organizer's approval. Update your UI to show the deferred state, and wait for
     * another callback that indicates the final status.
     * @platform ios
     */
    InAppPurchaseState[InAppPurchaseState["DEFERRED"] = 4] = "DEFERRED";
})(InAppPurchaseState || (InAppPurchaseState = {}));
// @needsAudit
/**
 * Abstracts over the Android [Billing Response Codes](https://developer.android.com/reference/com/android/billingclient/api/BillingClient.BillingResponseCode)
 * and iOS [SKErrorCodes](https://developer.apple.com/documentation/storekit/skerrorcode?language=objc).
 */
export var IAPErrorCode;
(function (IAPErrorCode) {
    /**
     * An unknown or unexpected error occurred. See `SKErrorUnknown` on iOS, `ERROR` on Android.
     */
    IAPErrorCode[IAPErrorCode["UNKNOWN"] = 0] = "UNKNOWN";
    /**
     * The feature is not allowed on the current device, or the user is not authorized to make payments.
     * See `SKErrorClientInvalid`, `SKErrorPaymentInvalid`, and `SKErrorPaymentNotAllowed` on iOS,
     * `FEATURE_NOT_SUPPORTED` on Android.
     */
    IAPErrorCode[IAPErrorCode["PAYMENT_INVALID"] = 1] = "PAYMENT_INVALID";
    /**
     * Play Store service is not connected now. See `SERVICE_DISCONNECTED` on Android.
     */
    IAPErrorCode[IAPErrorCode["SERVICE_DISCONNECTED"] = 2] = "SERVICE_DISCONNECTED";
    /**
     * Network connection is down. See `SERVICE_UNAVAILABLE` on Android.
     */
    IAPErrorCode[IAPErrorCode["SERVICE_UNAVAILABLE"] = 3] = "SERVICE_UNAVAILABLE";
    /**
     * The request has reached the maximum timeout before Google Play responds. See `SERVICE_TIMEOUT`
     * on Android.
     */
    IAPErrorCode[IAPErrorCode["SERVICE_TIMEOUT"] = 4] = "SERVICE_TIMEOUT";
    /**
     * Billing API version is not supported for the type requested. See `BILLING_UNAVAILABLE` on
     * Android.
     */
    IAPErrorCode[IAPErrorCode["BILLING_UNAVAILABLE"] = 5] = "BILLING_UNAVAILABLE";
    /**
     * Requested product is not available for purchase. See `SKErrorStoreProductNotAvailable` on iOS,
     * `ITEM_UNAVAILABLE` on Android.
     */
    IAPErrorCode[IAPErrorCode["ITEM_UNAVAILABLE"] = 6] = "ITEM_UNAVAILABLE";
    /**
     * Invalid arguments provided to the API. This error can also indicate that the application was
     * not correctly signed or properly set up for In-app Billing in Google Play. See `DEVELOPER_ERROR`
     * on Android.
     */
    IAPErrorCode[IAPErrorCode["DEVELOPER_ERROR"] = 7] = "DEVELOPER_ERROR";
    /**
     * Failure to purchase since item is already owned. See `ITEM_ALREADY_OWNED` on Android.
     */
    IAPErrorCode[IAPErrorCode["ITEM_ALREADY_OWNED"] = 8] = "ITEM_ALREADY_OWNED";
    /**
     * Failure to consume since item is not owned. See `ITEM_NOT_OWNED` on Android.
     */
    IAPErrorCode[IAPErrorCode["ITEM_NOT_OWNED"] = 9] = "ITEM_NOT_OWNED";
    /**
     * Apple Cloud Service connection failed or invalid permissions.
     * See `SKErrorCloudServicePermissionDenied`, `SKErrorCloudServiceNetworkConnectionFailed` and
     * `SKErrorCloudServiceRevoked` on iOS.
     */
    IAPErrorCode[IAPErrorCode["CLOUD_SERVICE"] = 10] = "CLOUD_SERVICE";
    /**
     * The user has not yet acknowledged Apple’s privacy policy for Apple Music. See
     * `SKErrorPrivacyAcknowledgementRequired` on iOS.
     */
    IAPErrorCode[IAPErrorCode["PRIVACY_UNACKNOWLEDGED"] = 11] = "PRIVACY_UNACKNOWLEDGED";
    /**
     * The app is attempting to use a property for which it does not have the required entitlement.
     * See `SKErrorUnauthorizedRequestData` on iOS.
     */
    IAPErrorCode[IAPErrorCode["UNAUTHORIZED_REQUEST"] = 12] = "UNAUTHORIZED_REQUEST";
    /**
     * The offer identifier or price specified in App Store Connect is no longer valid. See
     * `SKErrorInvalidSignature`, `SKErrorInvalidOfferPrice`, `SKErrorInvalidOfferIdentifier` on iOS.
     */
    IAPErrorCode[IAPErrorCode["INVALID_IDENTIFIER"] = 13] = "INVALID_IDENTIFIER";
    /**
     * Parameters are missing in a payment discount. See `SKErrorMissingOfferParams` on iOS.
     */
    IAPErrorCode[IAPErrorCode["MISSING_PARAMS"] = 14] = "MISSING_PARAMS";
})(IAPErrorCode || (IAPErrorCode = {}));
// @needsAudit
export var IAPItemType;
(function (IAPItemType) {
    /**
     * One time purchase or consumable.
     */
    IAPItemType[IAPItemType["PURCHASE"] = 0] = "PURCHASE";
    /**
     * Subscription.
     */
    IAPItemType[IAPItemType["SUBSCRIPTION"] = 1] = "SUBSCRIPTION";
})(IAPItemType || (IAPItemType = {}));
//# sourceMappingURL=InAppPurchases.types.js.map