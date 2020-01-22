import * as types from './utils/types';
declare class Stripe {
    stripeInitialized: boolean;
    setOptionsAsync: (options: types.StripeOptions) => any;
    deviceSupportsAndroidPayAsync: () => Promise<boolean>;
    deviceSupportsApplePayAsync: () => Promise<boolean>;
    deviceSupportsNativePayAsync: () => Promise<boolean>;
    canMakeApplePayPaymentsAsync: (options?: types.CanMakeApplePayPaymentsOptions) => Promise<boolean>;
    canMakeAndroidPayPaymentsAsync: () => Promise<boolean>;
    canMakeNativePayPaymentsAsync: (options?: types.CanMakeApplePayPaymentsOptions) => Promise<boolean>;
    paymentRequestWithAndroidPayAsync: (options: types.PaymentRequestWithAndroidPayOptions) => Promise<types.AndroidToken>;
    paymentRequestWithApplePayAsync: (items: types.PaymentRequestWithApplePayItem[], options: types.PaymentRequestWithApplePayOptions) => Promise<types.AppleToken>;
    paymentRequestWithNativePayAsync(options: types.PaymentRequestWithApplePayOptions | types.PaymentRequestWithAndroidPayOptions, items?: types.PaymentRequestWithApplePayItem[]): Promise<types.AndroidToken | types.AppleToken>;
    completeApplePayRequestAsync: () => Promise<void>;
    completeNativePayRequestAsync: () => Promise<void>;
    cancelApplePayRequestAsync: () => Promise<void>;
    cancelNativePayRequestAsync: () => Promise<void>;
    openApplePaySetupAsync: () => Promise<void>;
    openNativePaySetupAsync: () => Promise<void>;
    paymentRequestWithCardFormAsync: (options?: types.PaymentRequestWithCardFormOptions) => Promise<types.AndroidToken | types.AppleToken>;
    createTokenWithCardAsync: (params: types.CreateTokenWithCardOptions) => Promise<types.AndroidToken | types.AppleToken>;
    createTokenWithBankAccountAsync: (params?: {}) => Promise<types.AndroidToken | types.AppleToken>;
    createSourceWithParamsAsync: (params: types.CreateSourceWithParamsOptions) => Promise<types.Source>;
}
declare const _default: Stripe;
export default _default;
