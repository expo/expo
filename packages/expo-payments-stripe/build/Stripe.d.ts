import * as types from './utils/types';
declare class Stripe {
    stripeInitialized: boolean;
    setOptionsAsync: (options: types.StripeOptions) => any;
    /** @deprecated use `deviceSupportsNativePay` */
    deviceSupportsAndroidPayAsync: () => Promise<boolean>;
    /** @deprecated use `deviceSupportsNativePay` */
    deviceSupportsApplePayAsync: () => Promise<boolean>;
    deviceSupportsNativePayAsync: () => Promise<boolean>;
    /** @deprecated use `canMakeNativePayPayments` */
    canMakeApplePayPaymentsAsync: (options?: types.CanMakeApplePayPaymentsOptions) => Promise<boolean>;
    /** @deprecated use `canMakeNativePayPayments` */
    canMakeAndroidPayPaymentsAsync: () => Promise<boolean>;
    canMakeNativePayPaymentsAsync: (options?: types.CanMakeApplePayPaymentsOptions) => Promise<boolean>;
    /** @deprecated use `paymentRequestWithNativePay` */
    paymentRequestWithAndroidPayAsync: (options: types.PaymentRequestWithAndroidPayOptions) => Promise<types.AndroidToken>;
    /** @deprecated use `paymentRequestWithNativePay` */
    paymentRequestWithApplePayAsync: (items: types.PaymentRequestWithApplePayItem[], options: types.PaymentRequestWithApplePayOptions) => Promise<types.AppleToken>;
    paymentRequestWithNativePayAsync(options: types.PaymentRequestWithApplePayOptions | types.PaymentRequestWithAndroidPayOptions, items?: types.PaymentRequestWithApplePayItem[]): Promise<types.AndroidToken | types.AppleToken>;
    /** @deprecated use completeNativePayRequest */
    completeApplePayRequestAsync: () => Promise<void>;
    completeNativePayRequestAsync: () => Promise<void>;
    /** @deprecated use `cancelNativePayRequest` */
    cancelApplePayRequestAsync: () => Promise<void>;
    cancelNativePayRequestAsync: () => Promise<void>;
    /** @deprecated use `openNativePaySetup` */
    openApplePaySetupAsync: () => Promise<void>;
    openNativePaySetupAsync: () => Promise<void>;
    paymentRequestWithCardFormAsync: (options?: types.PaymentRequestWithCardFormOptions) => Promise<types.AndroidToken | types.AppleToken>;
    createTokenWithCardAsync: (params: types.CreateTokenWithCardOptions) => Promise<types.AndroidToken | types.AppleToken>;
    createTokenWithBankAccountAsync: (params?: {}) => Promise<types.AndroidToken | types.AppleToken>;
    createSourceWithParamsAsync: (params: types.CreateSourceWithParamsOptions) => Promise<types.Source>;
}
declare const _default: Stripe;
export default _default;
