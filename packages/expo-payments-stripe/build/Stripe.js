import { NativeModulesProxy, UnavailabilityError } from '@unimodules/core';
import { Platform } from 'react-native';
import errorCodes from './errorCodes';
import checkArgs from './utils/checkArgs';
import processTheme from './utils/processTheme';
import * as validators from './utils/validators';
const { StripeModule } = NativeModulesProxy;
function checkInit(instance) {
    if (!instance.stripeInitialized) {
        throw new Error(`You should call init first.\nRead more https://github.com/tipsi/tipsi-stripe#usage`);
    }
}
class Stripe {
    constructor() {
        this.stripeInitialized = false;
        this.setOptionsAsync = (options) => {
            checkArgs(validators.setOptionsOptionsPropTypes, options, 'options', 'Stripe.setOptions');
            this.stripeInitialized = true;
            return StripeModule.init(options, errorCodes);
        };
        // @deprecated use deviceSupportsNativePay
        this.deviceSupportsAndroidPayAsync = () => StripeModule.deviceSupportsAndroidPay();
        // @deprecated use deviceSupportsNativePay
        this.deviceSupportsApplePayAsync = () => StripeModule.deviceSupportsApplePay();
        this.deviceSupportsNativePayAsync = () => Platform.select({
            ios: () => this.deviceSupportsApplePayAsync(),
            android: () => this.deviceSupportsAndroidPayAsync(),
            default: () => Promise.resolve(false),
        })();
        // @deprecated use canMakeNativePayPayments
        this.canMakeApplePayPaymentsAsync = (options = {}) => {
            checkArgs(validators.canMakeApplePayPaymentsOptionsPropTypes, options, 'options', 'Stripe.canMakeApplePayPayments');
            return StripeModule.canMakeApplePayPayments(options);
        };
        // @deprecated use canMakeNativePayPayments
        this.canMakeAndroidPayPaymentsAsync = () => StripeModule.canMakeAndroidPayPayments();
        // iOS requires networks array while Android requires nothing
        this.canMakeNativePayPaymentsAsync = (options = {}) => Platform.select({
            ios: () => this.canMakeApplePayPaymentsAsync(options),
            android: () => this.canMakeAndroidPayPaymentsAsync(),
            default: () => Promise.resolve(false),
        })();
        // @deprecated use paymentRequestWithNativePay
        this.paymentRequestWithAndroidPayAsync = (options) => {
            checkInit(this);
            checkArgs(validators.paymentRequestWithAndroidPayOptionsPropTypes, options, 'options', 'Stripe.paymentRequestWithAndroidPay');
            return StripeModule.paymentRequestWithAndroidPay(options);
        };
        // @deprecated use paymentRequestWithNativePay
        this.paymentRequestWithApplePayAsync = (items, options) => {
            checkInit(this);
            checkArgs(validators.paymentRequestWithApplePayItemsPropTypes, { items }, 'items', 'Stripe.paymentRequestWithApplePay');
            checkArgs(validators.paymentRequestWithApplePayOptionsPropTypes, options, 'options', 'Stripe.paymentRequestWithApplePay');
            return StripeModule.paymentRequestWithApplePay(items, options);
        };
        // @deprecated use completeNativePayRequest
        this.completeApplePayRequestAsync = () => {
            checkInit(this);
            return StripeModule.completeApplePayRequest();
        };
        // no corresponding android impl exists
        this.completeNativePayRequestAsync = () => Platform.select({
            ios: () => this.completeApplePayRequestAsync(),
            default: () => Promise.resolve(),
        })();
        // @deprecated use cancelNativePayRequest
        this.cancelApplePayRequestAsync = () => {
            checkInit(this);
            return StripeModule.cancelApplePayRequestAsync();
        };
        // no corresponding android impl exists
        this.cancelNativePayRequestAsync = () => Platform.select({
            ios: () => this.cancelApplePayRequestAsync(),
            default: () => Promise.resolve(),
        })();
        // @deprecated use openNativePaySetup
        this.openApplePaySetupAsync = () => StripeModule.openApplePaySetup();
        // no corresponding android impl exists
        this.openNativePaySetupAsync = () => Platform.select({
            ios: () => this.openApplePaySetupAsync(),
            default: () => Promise.resolve(),
        })();
        this.paymentRequestWithCardFormAsync = (options = {}) => {
            checkInit(this);
            checkArgs(validators.paymentRequestWithCardFormOptionsPropTypes, options, 'options', 'Stripe.paymentRequestWithCardForm');
            return StripeModule.paymentRequestWithCardForm({
                ...options,
                theme: processTheme(options.theme),
            });
        };
        this.createTokenWithCardAsync = (params) => {
            checkInit(this);
            checkArgs(validators.createTokenWithCardParamsPropTypes, params, 'params', 'Stripe.createTokenWithCard');
            return StripeModule.createTokenWithCard(params);
        };
        this.createTokenWithBankAccountAsync = (params = {}) => {
            checkInit(this);
            checkArgs(validators.createTokenWithBankAccountParamsPropTypes, params, 'params', 'Stripe.createTokenWithBankAccount');
            return StripeModule.createTokenWithBankAccount(params);
        };
        this.createSourceWithParamsAsync = (params) => {
            checkInit(this);
            checkArgs(validators.createSourceWithParamsPropType, params, 'params', 'Stripe.createSourceWithParams');
            return StripeModule.createSourceWithParams(params);
        };
    }
    paymentRequestWithNativePayAsync(options, items = []) {
        const nativePaymentFunction = Platform.select({
            ios: () => this.paymentRequestWithApplePayAsync(items, options),
            android: () => this.paymentRequestWithAndroidPayAsync(options),
            default: () => Promise.reject(new UnavailabilityError('expo-payments-stripe', 'paymentRequestWithNativePayAsync')),
        });
        return nativePaymentFunction();
    }
}
export default new Stripe();
//# sourceMappingURL=Stripe.js.map