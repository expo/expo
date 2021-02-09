import PropTypes from 'prop-types';
export declare const availableApplePayNetworks: string[];
export declare const availableApplePayAddressFields: string[];
export declare const availableApplePayShippingTypes: string[];
export declare const availableSourceTypes: string[];
export declare const setOptionsOptionsPropTypes: {
    publishableKey: PropTypes.Requireable<string>;
    merchantId: PropTypes.Requireable<string>;
    androidPayMode: PropTypes.Requireable<string>;
};
export declare const availableApplePayNetworkPropTypes: PropTypes.Requireable<string>;
export declare const canMakeApplePayPaymentsOptionsPropTypes: {
    networks: PropTypes.Requireable<(string | null | undefined)[]>;
};
export declare const paymentRequestWithApplePayItemPropTypes: {
    label: PropTypes.Validator<string>;
    amount: PropTypes.Validator<string>;
    type: PropTypes.Requireable<string>;
};
export declare const paymentRequestWithApplePayItemsPropTypes: {
    items: PropTypes.Validator<(PropTypes.InferProps<{
        label: PropTypes.Validator<string>;
        amount: PropTypes.Validator<string>;
        type: PropTypes.Requireable<string>;
    }> | null | undefined)[]>;
};
export declare const applePayAddressFieldsPropTypes: PropTypes.Requireable<string>;
export declare const applePayOptionShippingMethodPropTypes: {
    id: PropTypes.Validator<string>;
    label: PropTypes.Validator<string>;
    detail: PropTypes.Validator<string>;
    amount: PropTypes.Validator<string>;
};
export declare const paymentRequestWithApplePayOptionsPropTypes: {
    currencyCode: PropTypes.Requireable<string>;
    countryCode: PropTypes.Requireable<string>;
    requiredBillingAddressFields: PropTypes.Requireable<(string | null | undefined)[]>;
    requiredShippingAddressFields: PropTypes.Requireable<(string | null | undefined)[]>;
    shippingMethods: PropTypes.Requireable<(PropTypes.InferProps<{
        id: PropTypes.Validator<string>;
        label: PropTypes.Validator<string>;
        detail: PropTypes.Validator<string>;
        amount: PropTypes.Validator<string>;
    }> | null | undefined)[]>;
    shippingType: PropTypes.Requireable<string>;
};
export declare const paymentRequestWithCardFormOptionsPropTypes: {
    requiredBillingAddressFields: PropTypes.Requireable<string>;
    managedAccountCurrency: PropTypes.Requireable<string>;
    smsAutofillDisabled: PropTypes.Requireable<boolean>;
    prefilledInformation: PropTypes.Requireable<PropTypes.InferProps<{
        email: PropTypes.Requireable<string>;
        phone: PropTypes.Requireable<string>;
        billingAddress: PropTypes.Requireable<PropTypes.InferProps<{
            name: PropTypes.Requireable<string>;
            line1: PropTypes.Requireable<string>;
            line2: PropTypes.Requireable<string>;
            city: PropTypes.Requireable<string>;
            state: PropTypes.Requireable<string>;
            postalCode: PropTypes.Requireable<string>;
            country: PropTypes.Requireable<string>;
            phone: PropTypes.Requireable<string>;
            email: PropTypes.Requireable<string>;
        }>>;
    }>>;
    theme: PropTypes.Requireable<PropTypes.InferProps<{
        primaryBackgroundColor: PropTypes.Requireable<string>;
        secondaryBackgroundColor: PropTypes.Requireable<string>;
        primaryForegroundColor: PropTypes.Requireable<string>;
        secondaryForegroundColor: PropTypes.Requireable<string>;
        accentColor: PropTypes.Requireable<string>;
        errorColor: PropTypes.Requireable<string>;
    }>>;
};
export declare const createTokenWithCardParamsPropTypes: {
    number: PropTypes.Validator<string>;
    expMonth: PropTypes.Validator<number>;
    expYear: PropTypes.Validator<number>;
    cvc: PropTypes.Requireable<string>;
    name: PropTypes.Requireable<string>;
    addressLine1: PropTypes.Requireable<string>;
    addressLine2: PropTypes.Requireable<string>;
    addressCity: PropTypes.Requireable<string>;
    addressState: PropTypes.Requireable<string>;
    addressZip: PropTypes.Requireable<string>;
    addressCountry: PropTypes.Requireable<string>;
    country: PropTypes.Requireable<string>;
    currency: PropTypes.Requireable<string>;
    brand: PropTypes.Requireable<string>;
    last4: PropTypes.Requireable<string>;
    fingerprint: PropTypes.Requireable<string>;
    funding: PropTypes.Requireable<string>;
};
export declare const createTokenWithBankAccountParamsPropTypes: {
    accountNumber: PropTypes.Validator<string>;
    countryCode: PropTypes.Validator<string>;
    currency: PropTypes.Validator<string>;
    routingNumber: PropTypes.Requireable<string>;
    accountHolderName: PropTypes.Requireable<string>;
    accountHolderType: PropTypes.Requireable<string>;
};
export declare const androidPayLineItemPropTypes: {
    currency_code: PropTypes.Validator<string>;
    total_price: PropTypes.Validator<string>;
    unit_price: PropTypes.Validator<string>;
    quantity: PropTypes.Validator<string>;
    description: PropTypes.Validator<string>;
};
export declare const paymentRequestWithAndroidPayOptionsPropTypes: {
    total_price: PropTypes.Validator<string>;
    currency_code: PropTypes.Validator<string>;
    line_items: PropTypes.Validator<(PropTypes.InferProps<{
        currency_code: PropTypes.Validator<string>;
        total_price: PropTypes.Validator<string>;
        unit_price: PropTypes.Validator<string>;
        quantity: PropTypes.Validator<string>;
        description: PropTypes.Validator<string>;
    }> | null | undefined)[]>;
    shipping_address_required: PropTypes.Requireable<boolean>;
    billing_address_required: PropTypes.Requireable<boolean>;
};
export declare const createSourceWithParamsPropType: {
    type: PropTypes.Validator<string>;
    amount: PropTypes.Requireable<number>;
    name: PropTypes.Requireable<string>;
    returnURL: PropTypes.Requireable<string>;
    statementDescriptor: PropTypes.Requireable<string>;
    currency: PropTypes.Requireable<string>;
    email: PropTypes.Requireable<string>;
    bank: PropTypes.Requireable<string>;
    iban: PropTypes.Requireable<string>;
    addressLine1: PropTypes.Requireable<string>;
    city: PropTypes.Requireable<string>;
    postalCode: PropTypes.Requireable<string>;
    country: PropTypes.Requireable<string>;
    card: PropTypes.Requireable<string>;
};
