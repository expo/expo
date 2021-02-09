export interface StripeOptions {
    publishableKey: string;
    /**
     * Used for payments with Apple Pay.
     */
    merchantId?: string;
    /**
     * Used to set wallet environment for Android Pay.
     */
    androidPayMode?: string;
}
export declare type PaymentNetwork = 'american_express' | 'discover' | 'master_card' | 'visa';
export interface CanMakeApplePayPaymentsOptions {
    /**
     * Indicates whether the user can make Apple Pay payments through the specified network.
     * If `networks` is not specified, all available networks are used.
     */
    networks?: PaymentNetwork[];
}
export interface LineItem {
    /**
     * Currency code string.
     */
    currency_code: string;
    /**
     * Short description that will be shown to the user.
     */
    description: string;
    /**
     * Total order price.
     */
    total_price: string;
    /**
     * Price per unit.
     */
    unit_price: string;
    /**
     * Number of items.
     */
    quantity: string;
}
export interface PaymentRequestWithAndroidPayOptions {
    /**
     * Total price for items.
     */
    total_price: string;
    /**
     * Three-letter ISO currency code representing the currency paid out to the bank account
     */
    currency_code: string;
    /**
     * Is shipping address menu required? Default is false.
     */
    shipping_address_required?: boolean;
    /**
     * Is billing address menu required? Default is false.
     */
    billing_address_required?: boolean;
    /**
     * Array of purchased items. Each item contains line_item
     */
    line_items: LineItem[];
}
export declare type CardBrand = 'JCB' | 'American Express' | 'Visa' | 'Discover' | 'Diners Club' | 'MasterCard' | 'Unknown';
export declare type CardFunding = 'debit' | 'credit' | 'prepaid' | 'unknown';
export interface Card {
    /**
     * The Stripe ID for the card.
     */
    cardId: string;
    /**
     * The card’s brand. Can be one of: JCB ‖ American Express ‖ Visa ‖ Discover ‖ Diners Club ‖ MasterCard ‖ Unknown
     * */
    brand: CardBrand;
    /**
     * [iOS only] The card’s funding.
     */
    funding: CardFunding;
    /**
     * The last 4 digits of the card.
     */
    last4: string;
    /**
     * [iOS only] For cards made with Apple Pay, this refers to the last 4 digits of the Device Account Number for the tokenized card.
     */
    dynamicLast4: string;
    /**
     * Whether or not the card originated from Apple Pay.
     */
    isApplePayCard: boolean;
    /**
     * The card’s expiration month. 1-indexed (i.e. 1 == January)
     */
    expMonth: number;
    /**
     * The card’s expiration year.
     */
    expYear: number;
    /**
     * Two-letter ISO code representing the issuing country of the card.
     */
    country: string;
    /**
     * This is only applicable when tokenizing debit cards to issue payouts to managed accounts.
     * The card can then be used as a transfer destination for funds in this currency.
     */
    currency: string;
    /**
     * The cardholder’s name.
     */
    name: string;
    /**
     * The cardholder’s first address line.
     */
    addressLine1: string;
    /**
     * The cardholder’s second address line.
     */
    addressLine2: string;
    /**
     * The cardholder’s city.
     */
    addressCity: string;
    /**
     * The cardholder’s state.
     */
    addressState: string;
    /**
     * The cardholder’s country.
     */
    addressCountry: string;
    /**
     * The cardholder’s zip code.
     */
    addressZip: string;
}
export declare type BankAccountType = 'company' | 'individual';
export interface BankAccount {
    /**
     * The routing number of this account.
     */
    routingNumber: string;
    /**
     * The account number for this bank account.
     */
    accountNumber: string;
    /**
     * The two-letter country code that this account was created in.
     */
    countryCode: string;
    /**
     * The currency of this account.
     */
    currency: string;
    /**
     * The account holder's name.
     */
    accountHolderName: string;
    /**
     * The bank account type.
     */
    accountHolderType: BankAccountType;
    /**
     * The account fingerprint.
     */
    fingerprint: string;
    /**
     * The name of the bank.
     */
    bankName: string;
    /**
     * The last four digits of the account number.
     */
    last4: string;
}
export interface AndroidToken {
    /**
     * The value of the token. You can store this value on your server and use it to make charges and customers.
     */
    tokenId: string;
    /**
     * When the token was created
     */
    created: number;
    /**
     * Whether or not this token was created in livemode. Will be `1` if you used your Live Publishable Key, and `0` if you used your Test Publishable Key.
     */
    livemode: number;
    /**
     * The credit card details object that were used to create the token.
     */
    card: Card;
    /**
     * The external (bank) account details object that were used to create the token.
     */
    bankAccount: BankAccount;
    /**
     * Any additional information that method can provide.
     */
    extra: object;
}
export declare type ItemType = 'pending' | 'final';
export interface PaymentRequestWithApplePayItem {
    /**
     * A short, localized description of the item.
     */
    label: string;
    /**
     * The summary item’s amount.
     */
    amount: string;
    /**
     * The summary item’s type. Default is 'final'.
     */
    type?: ItemType;
}
export declare type AddressField = 'all' | 'name' | 'email' | 'phone' | 'postal_address';
export declare type ShippingType = 'shipping' | 'delivery' | 'store_pickup' | 'service_pickup';
export interface ShippingMethod {
    /**
     * A unique identifier for the shipping method, used by the app.
     */
    id: string;
    /**
     * A short, localized description of the shipping method.
     */
    label: string;
    /**
     * A user-readable description of the shipping method.
     */
    detail: string;
    /**
     * The shipping method’s amount.
     */
    amount: string;
}
export interface PaymentRequestWithApplePayOptions {
    /**
     * A bit field of billing address fields that you need in order to process the transaction.
     * Array either should contain at least one valid value or should not be specified to disable.
     */
    requiredBillingAddressFields?: AddressField[];
    /**
     * A bit field of shipping address fields that you need in order to process the transaction.
     * Array either should contain at least one valid value or should not be specified to disable.
     */
    requiredShippingAddressFields?: AddressField[];
    /**
     * An array of `ShippingMethod` objects that describe the supported shipping methods.
     */
    shippingMethods: ShippingMethod[];
    /**
     * The three-letter ISO 4217 currency code. Default is USD.
     */
    currencyCode?: string;
    /**
     * The two-letter code for the country where the payment will be processed. Default is US.
     */
    countryCode?: string;
    /**
     * An optional value that indicates how purchased items are to be shipped. Default is shipping.
     */
    shippingType?: ShippingType;
}
export interface Contact {
    /**
     * The contact’s name.
     */
    name: string;
    /**
     * The contact’s phone number.
     */
    phoneNumber: string;
    /**
     * The contact’s email address.
     */
    emailAddress: string;
    /**
     * The street name in a postal address.
     */
    street: string;
    /**
     * The city name in a postal address.
     */
    city: string;
    /**
     * The state name in a postal address.
     */
    state: string;
    /**
     * The country name in a postal address.
     */
    country: string;
    /**
     * The ISO country code for the country in a postal address.
     */
    ISOCountryCode: string;
    /**
     * The postal code in a postal address.
     */
    postalCode: string;
    /**
     * The contact’s sublocality.
     */
    supplementarySubLocality: string;
}
export interface AppleToken {
    /**
     * Selected ShippingMethod object.
     */
    shippingMethod: ShippingMethod;
    /**
     * The user's billing contact object.
     */
    billingContact: object;
    /**
     * The user's shipping contact object.
     */
    shippingContact: object;
}
export declare type RequiredBillingAddressFields = 'full' | 'zip';
export interface Theme {
    /**
     * The primary background color of the theme.
     */
    primaryBackgroundColor?: string;
    /**
     * The secondary background color of this theme.
     */
    secondaryBackgroundColor?: string;
    /**
     * The primary foreground color of this theme. This will be used as the text color for any important labels in a view with this theme (such as the text color for a text field that the user needs to fill out).
     */
    primaryForegroundColor?: string;
    /**
     * The secondary foreground color of this theme. This will be used as the text color for any supplementary labels in a view with this theme (such as the placeholder color for a text field that the user needs to fill out).
     */
    secondaryForegroundColor?: string;
    /**
     * The accent color of this theme - it will be used for any buttons and other elements on a view that are important to highlight.
     */
    accentColor?: string;
    /**
     * The error color of this theme - it will be used for rendering any error messages or view.
     */
    errorColor?: string;
}
export interface PrefilledAddress {
    /**
     * The user’s full name (e.g. "Jane Doe").
     */
    name: string;
    /**
     * The first line of the user’s street address (e.g. "123 Fake St").
     */
    line1: string;
    /**
     * The apartment, floor number, etc of the user’s street address (e.g. "Apartment 1A").
     */
    line2: string;
    /**
     * The city in which the user resides (e.g. "San Francisco").
     */
    city: string;
    /**
     * The state in which the user resides (e.g. "CA").
     */
    state: string;
    /**
     * The postal code in which the user resides (e.g. "90210").
     */
    postalCode: string;
    /**
     * The ISO country code of the address (e.g. "US").
     */
    country: string;
    /**
     * The phone number of the address (e.g. "8885551212").
     */
    phone: string;
    /**
     * The email of the address (e.g. "jane@doe.com").
     */
    email: string;
}
export interface PrefilledInformation {
    /**
     * The user’s shipping address. When set, the shipping address form will be filled with this address. The user will also has the option to fill their billing address using this address.
     */
    shippingAddress?: PrefilledAddress;
    /**
     * The user’s billing address. When set, the "add card" form will be filled with this address. The user will also has the option to fill their shipping address using this address.
     */
    billingAddress?: PrefilledAddress;
}
export interface PaymentRequestWithCardFormOptions {
    /**
     * The billing address fields the user must fill out when prompted for their payment details.
     * The default disables required fields.
     */
    requiredBillingAddressFields?: RequiredBillingAddressFields;
    /**
     * You can set this property to pre-fill any information you’ve already collected from your user.
     */
    prefilledInformation?: PrefilledInformation;
    /**
     * Required to be able to add the card to an account (in all other cases, this parameter is not used).
     */
    managedAccountCurrency?: string;
    /**
     * Can be used to visually style Stripe-provided UI.
     */
    theme?: Theme;
}
export interface CreateTokenWithCardOptions {
    /**
     * The card’s number.
     */
    number: string;
    /**
     * The card’s expiration month.
     */
    expMonth: number;
    /**
     * The card’s expiration year.
     */
    expYear: number;
    /**
     * The card’s security code, found on the back.
     */
    cvc?: string;
    /**
     * The cardholder’s name.
     */
    name?: string;
    /**
     * The first line of the billing address.
     */
    addressLine1?: string;
    /**
     * The second line of the billing address.
     */
    addressLine2?: string;
    /**
     * City of the billing address.
     */
    addressCity?: string;
    /**
     * State of the billing address.
     */
    addressState?: string;
    /**
     * Zip code of the billing address.
     */
    addressZip?: string;
    /**
     * Country for the billing address.
     */
    addressCountry?: string;
    /**
     * [Android only] Brand of this card. Can be one of: JCB ‖ American Express ‖ Visa ‖ Discover ‖ Diners Club ‖ MasterCard ‖ Unknown
     */
    brand?: string;
    /**
     * [Android only] Last 4 digits of the card.
     */
    last4?: string;
    /**
     * [Android only] The card fingerprint.
     */
    fingerprint?: string;
    /**
     * [Android only] The funding type of the card. Can be one of: debit ‖ credit ‖ prepaid ‖ unknown
     */
    funding?: string;
    /**
     * [Android only] ISO country code of the card itself
     */
    country?: string;
    /**
     * Three-letter ISO currency code representing the currency paid out to the bank account. This is only applicable when tokenizing debit cards to issue payouts to managed accounts. You should not set it otherwise. The card can then be used as a transfer destination for funds in this currency.
     */
    currency?: string;
}
export declare type SourceType = 'alipay' | 'bancontact' | 'card' | 'griopay' | 'ideal' | 'sepaDebit' | 'sofort' | 'threeDSecure' | 'unknown';
export interface CreateSourceWithParamsOptions {
    /**
     * The type of the source to create. Depending on the type you need to provide different params. Check the STPSourceParams docs for reference
     */
    type: SourceType;
    /**
     * A positive number in the smallest currency unit representing the amount to charge the customer (e.g., 1099 for a €10.99 payment).
     */
    amount?: number;
    /**
     * The full name of the account holder.
     */
    name?: string;
    /**
     * The URL the customer should be redirected to after they have successfully verified the payment.
     */
    returnURL?: string;
    /**
     * A custom statement descriptor for the payment.
     */
    statementDescriptor?: string;
    /**
     * The currency associated with the source. This is the currency for which the source will be chargeable once ready.
     */
    currency?: string;
    /**
     * The customer’s email address.
     */
    email?: string;
    /**
     * The customer’s bank.
     */
    bank?: string;
    /**
     * The IBAN number for the bank account you wish to debit.
     */
    iban?: string;
    /**
     * The bank account holder’s first address line (optional).
     */
    addressLine1?: string;
    /**
     * The bank account holder’s city.
     */
    city?: string;
    /**
     * The bank account holder’s postal code.
     */
    postalCode?: string;
    /**
     * The bank account holder’s two-letter country code (sepaDebit) or the country code of the customer’s bank (sofort)
     */
    country?: string;
    /**
     * The ID of the card source.
     */
    card?: string;
}
export declare type SourceAuthenticationFlow = 'none' | 'redirect' | 'verification' | 'receiver' | 'unknown';
export declare type SourceStatus = 'pending' | 'chargable' | 'consumed' | 'cancelled' | 'failed';
export declare type SourceUsage = 'reusable' | 'single' | 'unknown';
export interface SourceOwner {
    /**
     * Owner’s address.
     */
    address?: object;
    /**
     * Owner’s email address.
     */
    email?: string;
    /**
     * Owner’s full name.
     */
    name?: string;
    /**
     * Owner’s phone number.
     */
    phone?: string;
    /**
     * Verified owner’s address,
     */
    verifiedAddress?: object;
    /**
     * Verified owner’s email address.
     */
    verifiedEmail?: string;
    /**
     * Verified owner’s full name.
     */
    verifiedName?: string;
    /**
     * Verified owner’s phone number.
     */
    verifiedPhone?: string;
}
export interface SourceReceiver {
    /**
     * The address of the receiver source. This is the value that should be communicated to the customer to send their funds to.
     */
    address: object;
    /**
     * The total amount charged by you.
     */
    amountCharged: number;
    /**
     * The total amount received by the receiver source.
     */
    amountReceived: number;
    /**
     * The total amount that was returned to the customer.
     */
    amountReturned: number;
}
export declare type SourceRedirectStatus = 'pending' | 'succeeded' | 'failed' | 'unknown';
export interface SourceRedirect {
    /**
     * The URL you provide to redirect the customer to after they authenticated their payment.
     */
    returnURL: string;
    /**
     * The status of the redirect.
     */
    status: SourceRedirectStatus;
    /**
     * The URL provided to you to redirect a customer to as part of a redirect authentication flow.
     */
    url: string;
}
export declare type SourceVerificationStatus = 'pending' | 'succeeded' | 'failed' | 'unknown';
export interface SourceVerification {
    /**
     * The number of attempts remaining to authenticate the source object with a verification code.
     */
    attemptsRemaining: number;
    /**
     * The status of the verification.
     */
    status: SourceVerificationStatus;
}
export declare type SourceCardBrand = 'JCB' | 'American Express' | 'Visa' | 'Discover' | 'Diners Club' | 'MasterCard' | 'Unknown';
export declare type SourceCardFundingType = 'debit' | 'credit' | 'prepaid' | 'unknown';
export declare type ThreeDSecureStatus = 'required' | 'optional' | 'notSupported' | 'unknown';
export interface SourceCardDetails {
    /**
     * The last 4 digits of the card.
     */
    last4: string;
    /**
     * The card’s expiration month. 1-indexed (i.e. 1 == January).
     */
    expMonth: number;
    /**
     * The card’s expiration year.
     */
    expYear: number;
    /**
     * The issuer of the card. Can be one of:
     */
    brand: SourceCardBrand;
    /**
     * [iOS only] The funding source for the card.
     */
    funding: SourceCardFundingType;
    /**
     * Two-letter ISO code representing the issuing country of the card.
     */
    country: string;
    /**
     * Whether 3D Secure is supported or required by the card.
     */
    threeDSecure: ThreeDSecureStatus;
}
export interface SourceSepaDebitDetails {
    /**
     * The last 4 digits of the account number.
     */
    last4: string;
    /**
     * The account’s bank code.
     */
    bankCode: string;
    /**
     * Two-letter ISO code representing the country of the bank account.
     */
    country: string;
    /**
     * The account’s fingerprint.
     */
    fingerprint: string;
    /**
     * The reference of the mandate accepted by your customer.
     */
    mandateReference: string;
    /**
     * The details of the mandate accepted by your customer.
     */
    mandateURL: string;
}
export interface Source {
    /**
     * The amount associated with the source.
     */
    amount: number;
    /**
     * The client secret of the source. Used for client-side polling using a publishable key.
     */
    clientSecret: string;
    /**
     * When the source was created.
     */
    created: number;
    /**
     * The currency associated with the source.
     */
    currency: string;
    /**
     * The authentication flow of the source.
     */
    flow: SourceAuthenticationFlow;
    /**
     * Whether or not this source was created in livemode. Will be true if you used your Live Publishable Key, and false if you used your Test Publishable Key.
     */
    livemode: boolean;
    /**
     * A set of key/value pairs associated with the source object.
     */
    metadata: object;
    /**
     * Information about the owner of the payment instrument.
     */
    owner: SourceOwner;
    /**
     * Information related to the receiver flow. Present if the source is a receiver.
     */
    receiver?: SourceReceiver;
    /**
     * Information related to the redirect flow. Present if the source is authenticated by a redirect.
     */
    redirect?: SourceRedirect;
    /**
     * The status of the source.
     */
    status: SourceStatus;
    /**
     * The type of the source.
     */
    type: SourceType;
    /**
     * Whether this source should be reusable or not.
     */
    usage: SourceUsage;
    /**
     * Information related to the verification flow. Present if the source is authenticated by a verification.
     */
    verification?: SourceVerification;
    /**
     * Information about the source specific to its type.
     */
    details: object;
    /**
     * If this is a card source, this property contains information about the card.
     */
    cardDetails?: SourceCardDetails;
    /**
     * If this is a SEPA Debit source, this property contains information about the sepaDebit.
     */
    sepaDebitDetails?: SourceSepaDebitDetails;
}
