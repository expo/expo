import { NativeModulesProxy, UnavailabilityError } from 'expo-modules-core';
import { Platform } from 'react-native';
import errorCodes from './errorCodes';
import checkArgs from './utils/checkArgs';
import processTheme from './utils/processTheme';
import * as validators from './utils/validators';
const { StripeModule } = NativeModulesProxy;
console.warn('`expo-payments-stripe` has been deprecated in favor of `@stripe/stripe-react-native`. For more information on the new library, and how to migrate away from `expo-payments-stripe`, please refer to https://docs.expo.dev/versions/latest/sdk/stripe/. This package will no longer be available in SDK 43.');
function checkInit(instance) {
    if (!instance.stripeInitialized) {
        throw new Error(`You should call init first.\nRead more https://github.com/tipsi/tipsi-stripe#usage`);
    }
}
class Stripe {
    stripeInitialized = false;
    setOptionsAsync = (options) => {
        checkArgs(validators.setOptionsOptionsPropTypes, options, 'options', 'Stripe.setOptions');
        this.stripeInitialized = true;
        return StripeModule.init(options, errorCodes);
    };
    /** @deprecated use `deviceSupportsNativePay` */
    deviceSupportsAndroidPayAsync = () => StripeModule.deviceSupportsAndroidPay();
    /** @deprecated use `deviceSupportsNativePay` */
    deviceSupportsApplePayAsync = () => StripeModule.deviceSupportsApplePay();
    deviceSupportsNativePayAsync = () => Platform.select({
        ios: () => this.deviceSupportsApplePayAsync(),
        android: () => this.deviceSupportsAndroidPayAsync(),
        default: () => Promise.resolve(false),
    })();
    /** @deprecated use `canMakeNativePayPayments` */
    canMakeApplePayPaymentsAsync = (options = {}) => {
        checkArgs(validators.canMakeApplePayPaymentsOptionsPropTypes, options, 'options', 'Stripe.canMakeApplePayPayments');
        return StripeModule.canMakeApplePayPayments(options);
    };
    /** @deprecated use `canMakeNativePayPayments` */
    canMakeAndroidPayPaymentsAsync = () => StripeModule.canMakeAndroidPayPayments();
    // iOS requires networks array while Android requires nothing
    canMakeNativePayPaymentsAsync = (options = {}) => Platform.select({
        ios: () => this.canMakeApplePayPaymentsAsync(options),
        android: () => this.canMakeAndroidPayPaymentsAsync(),
        default: () => Promise.resolve(false),
    })();
    /** @deprecated use `paymentRequestWithNativePay` */
    paymentRequestWithAndroidPayAsync = (options) => {
        checkInit(this);
        checkArgs(validators.paymentRequestWithAndroidPayOptionsPropTypes, options, 'options', 'Stripe.paymentRequestWithAndroidPay');
        return StripeModule.paymentRequestWithAndroidPay(options);
    };
    /** @deprecated use `paymentRequestWithNativePay` */
    paymentRequestWithApplePayAsync = (items, options) => {
        checkInit(this);
        checkArgs(validators.paymentRequestWithApplePayItemsPropTypes, { items }, 'items', 'Stripe.paymentRequestWithApplePay');
        checkArgs(validators.paymentRequestWithApplePayOptionsPropTypes, options, 'options', 'Stripe.paymentRequestWithApplePay');
        return StripeModule.paymentRequestWithApplePay(items, options);
    };
    paymentRequestWithNativePayAsync(options, items = []) {
        const nativePaymentFunction = Platform.select({
            ios: () => this.paymentRequestWithApplePayAsync(items, options),
            android: () => this.paymentRequestWithAndroidPayAsync(options),
            default: () => Promise.reject(new UnavailabilityError('expo-payments-stripe', 'paymentRequestWithNativePayAsync')),
        });
        return nativePaymentFunction();
    }
    /** @deprecated use completeNativePayRequest */
    completeApplePayRequestAsync = () => {
        checkInit(this);
        return StripeModule.completeApplePayRequest();
    };
    // no corresponding android impl exists
    completeNativePayRequestAsync = () => Platform.select({
        ios: () => this.completeApplePayRequestAsync(),
        default: () => Promise.resolve(),
    })();
    /** @deprecated use `cancelNativePayRequest` */
    cancelApplePayRequestAsync = () => {
        checkInit(this);
        return StripeModule.cancelApplePayRequest();
    };
    // no corresponding android impl exists
    cancelNativePayRequestAsync = () => Platform.select({
        ios: () => this.cancelApplePayRequestAsync(),
        default: () => Promise.resolve(),
    })();
    /** @deprecated use `openNativePaySetup` */
    openApplePaySetupAsync = () => StripeModule.openApplePaySetup();
    // no corresponding android impl exists
    openNativePaySetupAsync = () => Platform.select({
        ios: () => this.openApplePaySetupAsync(),
        default: () => Promise.resolve(),
    })();
    paymentRequestWithCardFormAsync = (options = {}) => {
        checkInit(this);
        checkArgs(validators.paymentRequestWithCardFormOptionsPropTypes, options, 'options', 'Stripe.paymentRequestWithCardForm');
        return StripeModule.paymentRequestWithCardForm({
            ...options,
            theme: processTheme(options.theme),
        });
    };
    createTokenWithCardAsync = (params) => {
        checkInit(this);
        checkArgs(validators.createTokenWithCardParamsPropTypes, params, 'params', 'Stripe.createTokenWithCard');
        return StripeModule.createTokenWithCard(params);
    };
    createTokenWithBankAccountAsync = (params = {}) => {
        checkInit(this);
        checkArgs(validators.createTokenWithBankAccountParamsPropTypes, params, 'params', 'Stripe.createTokenWithBankAccount');
        return StripeModule.createTokenWithBankAccount(params);
    };
    createSourceWithParamsAsync = (params) => {
        checkInit(this);
        checkArgs(validators.createSourceWithParamsPropType, params, 'params', 'Stripe.createSourceWithParams');
        return StripeModule.createSourceWithParams(params);
    };
}
export default new Stripe();
//# sourceMappingURL=Stripe.js.map