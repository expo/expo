export type QueryResult = InAppPurchase | IAPItemDetails;
/**
 * The response type for queries and purchases.
 */
export interface IAPQueryResponse<QueryResult> {
    /**
     * The response code from a query or purchase.
     */
    responseCode: IAPResponseCode;
    /**
     * The array containing the `InAppPurchase` or `IAPItemDetails` objects requested depending on
     * the method.
     */
    results?: QueryResult[];
    /**
     * `IAPErrorCode` that provides more detail on why an error occurred. `null` unless `responseCode`
     * is `IAPResponseCode.ERROR`.
     */
    errorCode?: IAPErrorCode;
}
export declare enum IAPResponseCode {
    /**
     * Response returned successfully.
     */
    OK = 0,
    /**
     * User canceled the purchase.
     */
    USER_CANCELED = 1,
    /**
     * An error occurred. Check the `errorCode` for additional details.
     */
    ERROR = 2,
    /**
     * Purchase was deferred.
     * @platform ios
     */
    DEFERRED = 3
}
export declare enum InAppPurchaseState {
    /**
     * The transaction is being processed.
     */
    PURCHASING = 0,
    /**
     * The App Store successfully processed payment.
     */
    PURCHASED = 1,
    /**
     * The transaction failed.
     */
    FAILED = 2,
    /**
     * This transaction restores content previously purchased by the user. Read the
     * `originalTransaction` properties to obtain information about the original purchase.
     * @platform ios
     */
    RESTORED = 3,
    /**
     * The transaction has been received, but its final status is pending external
     * action such as the Ask to Buy feature where a child initiates a new purchase and has to wait
     * for the family organizer's approval. Update your UI to show the deferred state, and wait for
     * another callback that indicates the final status.
     * @platform ios
     */
    DEFERRED = 4
}
/**
 * Abstracts over the Android [Billing Response Codes](https://developer.android.com/reference/com/android/billingclient/api/BillingClient.BillingResponseCode)
 * and iOS [SKErrorCodes](https://developer.apple.com/documentation/storekit/skerrorcode?language=objc).
 */
export declare enum IAPErrorCode {
    /**
     * An unknown or unexpected error occurred. See `SKErrorUnknown` on iOS, `ERROR` on Android.
     */
    UNKNOWN = 0,
    /**
     * The feature is not allowed on the current device, or the user is not authorized to make payments.
     * See `SKErrorClientInvalid`, `SKErrorPaymentInvalid`, and `SKErrorPaymentNotAllowed` on iOS,
     * `FEATURE_NOT_SUPPORTED` on Android.
     */
    PAYMENT_INVALID = 1,
    /**
     * Play Store service is not connected now. See `SERVICE_DISCONNECTED` on Android.
     */
    SERVICE_DISCONNECTED = 2,
    /**
     * Network connection is down. See `SERVICE_UNAVAILABLE` on Android.
     */
    SERVICE_UNAVAILABLE = 3,
    /**
     * The request has reached the maximum timeout before Google Play responds. See `SERVICE_TIMEOUT`
     * on Android.
     */
    SERVICE_TIMEOUT = 4,
    /**
     * Billing API version is not supported for the type requested. See `BILLING_UNAVAILABLE` on
     * Android.
     */
    BILLING_UNAVAILABLE = 5,
    /**
     * Requested product is not available for purchase. See `SKErrorStoreProductNotAvailable` on iOS,
     * `ITEM_UNAVAILABLE` on Android.
     */
    ITEM_UNAVAILABLE = 6,
    /**
     * Invalid arguments provided to the API. This error can also indicate that the application was
     * not correctly signed or properly set up for In-app Billing in Google Play. See `DEVELOPER_ERROR`
     * on Android.
     */
    DEVELOPER_ERROR = 7,
    /**
     * Failure to purchase since item is already owned. See `ITEM_ALREADY_OWNED` on Android.
     */
    ITEM_ALREADY_OWNED = 8,
    /**
     * Failure to consume since item is not owned. See `ITEM_NOT_OWNED` on Android.
     */
    ITEM_NOT_OWNED = 9,
    /**
     * Apple Cloud Service connection failed or invalid permissions.
     * See `SKErrorCloudServicePermissionDenied`, `SKErrorCloudServiceNetworkConnectionFailed` and
     * `SKErrorCloudServiceRevoked` on iOS.
     */
    CLOUD_SERVICE = 10,
    /**
     * The user has not yet acknowledged Apple’s privacy policy for Apple Music. See
     * `SKErrorPrivacyAcknowledgementRequired` on iOS.
     */
    PRIVACY_UNACKNOWLEDGED = 11,
    /**
     * The app is attempting to use a property for which it does not have the required entitlement.
     * See `SKErrorUnauthorizedRequestData` on iOS.
     */
    UNAUTHORIZED_REQUEST = 12,
    /**
     * The offer identifier or price specified in App Store Connect is no longer valid. See
     * `SKErrorInvalidSignature`, `SKErrorInvalidOfferPrice`, `SKErrorInvalidOfferIdentifier` on iOS.
     */
    INVALID_IDENTIFIER = 13,
    /**
     * Parameters are missing in a payment discount. See `SKErrorMissingOfferParams` on iOS.
     */
    MISSING_PARAMS = 14
}
export declare enum IAPItemType {
    /**
     * One time purchase or consumable.
     */
    PURCHASE = 0,
    /**
     * Subscription.
     */
    SUBSCRIPTION = 1
}
export interface InAppPurchase {
    /**
     * Boolean indicating whether this item has been "acknowledged" via `finishTransactionAsync`.
     */
    acknowledged: boolean;
    /**
     * The product ID representing an item inputted in Google Play Console and App Store Connect.
     * @example `gold`
     */
    productId: string;
    /**
     * The state of the purchase.
     */
    purchaseState: InAppPurchaseState;
    /**
     * The time the product was purchased, in milliseconds since the epoch (Jan 1, 1970).
     */
    purchaseTime: number;
    /**
     * A string that uniquely identifies a successful payment transaction.
     */
    orderId: string;
    /**
     * The application package from which the purchase originated.
     * @platform android
     * @example `com.example.myapp`
     */
    packageName?: string;
    /**
     * A token that uniquely identifies a purchase for a given item and user pair.
     * @platform android
     */
    purchaseToken?: string;
    /**
     * Represents the original order ID for restored purchases.
     * @platform ios
     */
    originalOrderId?: string;
    /**
     * Represents the original purchase time for restored purchases.
     * @platform ios
     */
    originalPurchaseTime?: string;
    /**
     * The App Store receipt found in the main bundle encoded as a Base64 String.
     * @platform ios
     */
    transactionReceipt?: string;
}
/**
 * Details about the purchasable item that you inputted in App Store Connect and Google Play Console.
 */
export interface IAPItemDetails {
    /**
     * User facing description about the item.
     * @example `Currency used to trade for items in the game`
     */
    description: string;
    /**
     * The price formatted with the local currency symbol. Use this to display the price, not to make
     * calculations.
     * @example `$1.99`
     */
    price: string;
    /**
     * The price in micro-units, where 1,000,000 micro-units equal one unit of the currency. Use this
     * for calculations.
     * @example `1990000`
     */
    priceAmountMicros: number;
    /**
     * The local currency code from the ISO 4217 code list.
     * @example `USD`, `CAN`, `RUB`
     */
    priceCurrencyCode: string;
    /**
     * The product ID representing an item inputted in App Store Connect and Google Play Console.
     * @example `gold`
     */
    productId: string;
    /**
     * The title of the purchasable item. This should be displayed to the user and may be different
     * from the `productId`.
     * @example `Gold Coin`
     */
    title: string;
    /**
     * The type of the purchase. Note that this is not very accurate on iOS as this data is only
     * available on iOS 11.2 and higher and non-renewable subscriptions always return
     * `IAPItemType.PURCHASE`.
     */
    type: IAPItemType;
    /**
     * The length of a subscription period specified in ISO 8601 format. In-app purchases return `P0D`.
     * On iOS, non-renewable subscriptions also return `P0D`.
     * @example `P0D`, `P6W`, `P3M`, `P6M`, `P1Y`
     */
    subscriptionPeriod?: string;
}
export type IAPPurchaseHistoryOptions = {
    /**
     * A boolean that indicates whether or not you want to make a network request
     * to sync expired/consumed purchases and those on other devices.
     *
     * - If set to `true`, this method returns purchase details **only** for the user's currently
     *   owned items (active subscriptions and non-consumed one-time purchases). If set to `false`, it
     *   will make a network request and return the most recent purchase made by the user for each
     *   product, even if that purchase is expired, canceled, or consumed.
     * - The return type if this is `false` is actually a subset of when it's `true`. This is because
     *   Android returns a [`PurchaseHistoryRecord`](https://developer.android.com/reference/com/android/billingclient/api/PurchaseHistoryRecord)
     *   which only contains the purchase time, purchase token, and product ID, rather than all of the
     *   attributes found in the [`InAppPurchase`](#inapppurchase) type.
     *
     * @platform android
     * @default true
     */
    useGooglePlayCache: boolean;
};
/**
 * The `purchaseItemAsync` billing context on Android.
 * @platform android
 */
export interface IAPPurchaseItemOptions {
    /**
     * The `purchaseToken` of the purchase that the user is upgrading or downgrading from.
     * This is mandatory for replacing an old subscription such as when a user
     * upgrades from a monthly subscription to a yearly one that provides the same content. You can
     * get the purchase token from [`getPurchaseHistoryAsync`](#inapppurchasesgetpurchasehistoryasyncoptions).
     */
    oldPurchaseToken?: string;
    /**
     * Account identifiers, both need to be provided to work with Google Play Store.
     */
    accountIdentifiers?: {
        /**
         * The obfuscated account id of the user's Google Play account.
         */
        obfuscatedAccountId: string;
        /**
         * The obfuscated profile id of the user's Google Play account.
         */
        obfuscatedProfileId: string;
    };
    /**
     * Whether the purchase is happening in a VR context.
     */
    isVrPurchaseFlow?: boolean;
}
//# sourceMappingURL=InAppPurchases.types.d.ts.map