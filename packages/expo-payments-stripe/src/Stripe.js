import { Platform } from 'react-native';
import { NativeModulesProxy } from '@unimodules/core';
import processTheme from './utils/processTheme';
import checkArgs from './utils/checkArgs';
import checkInit from './utils/checkInit';
import * as types from './utils/types';
import errorCodes from './errorCodes';

const { StripeModule } = NativeModulesProxy;

class Stripe {
  stripeInitialized = false;

  setOptionsAsync = (options = {}) => {
    checkArgs(types.setOptionsOptionsPropTypes, options, 'options', 'Stripe.setOptions');

    this.stripeInitialized = true;

    return StripeModule.init(options, errorCodes);
  };

  // @deprecated use deviceSupportsNativePay
  deviceSupportsAndroidPayAsync = () => StripeModule.deviceSupportsAndroidPay();

  // @deprecated use deviceSupportsNativePay
  deviceSupportsApplePayAsync = () => StripeModule.deviceSupportsApplePay();

  deviceSupportsNativePayAsync = () =>
    Platform.select({
      ios: () => this.deviceSupportsApplePayAsync(),
      android: () => this.deviceSupportsAndroidPayAsync(),
    })();

  // @deprecated use canMakeNativePayPayments
  canMakeApplePayPaymentsAsync = (options = {}) => {
    checkArgs(
      types.canMakeApplePayPaymentsOptionsPropTypes,
      options,
      'options',
      'Stripe.canMakeApplePayPayments'
    );
    return StripeModule.canMakeApplePayPayments(options);
  };

  // @deprecated use canMakeNativePayPayments
  canMakeAndroidPayPaymentsAsync = () => StripeModule.canMakeAndroidPayPayments();

  // iOS requires networks array while Android requires nothing
  canMakeNativePayPaymentsAsync = (options = {}) =>
    Platform.select({
      ios: () => this.canMakeApplePayPaymentsAsync(options),
      android: () => this.canMakeAndroidPayPaymentsAsync(),
    })();

  // @deprecated use paymentRequestWithNativePay
  paymentRequestWithAndroidPayAsync = (options = {}) => {
    checkInit(this);
    checkArgs(
      types.paymentRequestWithAndroidPayOptionsPropTypes,
      options,
      'options',
      'Stripe.paymentRequestWithAndroidPay'
    );
    return StripeModule.paymentRequestWithAndroidPay(options);
  };

  // @deprecated use paymentRequestWithNativePay
  paymentRequestWithApplePayAsync = (items = [], options = {}) => {
    checkInit(this);
    checkArgs(
      types.paymentRequestWithApplePayItemsPropTypes,
      { items },
      'items',
      'Stripe.paymentRequestWithApplePay'
    );
    checkArgs(
      types.paymentRequestWithApplePayOptionsPropTypes,
      options,
      'options',
      'Stripe.paymentRequestWithApplePay'
    );
    return StripeModule.paymentRequestWithApplePay(items, options);
  };

  paymentRequestWithNativePayAsync(options = {}, items = []) {
    return Platform.select({
      ios: () => this.paymentRequestWithApplePayAsync(items, options),
      android: () => this.paymentRequestWithAndroidPayAsync(options),
    })();
  }

  // @deprecated use completeNativePayRequest
  completeApplePayRequestAsync = () => {
    checkInit(this);
    return StripeModule.completeApplePayRequest();
  };

  // no corresponding android impl exists
  completeNativePayRequestAsync = () =>
    Platform.select({
      ios: () => this.completeApplePayRequestAsync(),
      android: () => Promise.resolve(),
    })();

  // @deprecated use cancelNativePayRequest
  cancelApplePayRequestAsync = () => {
    checkInit(this);
    return StripeModule.cancelApplePayRequestAsync();
  };

  // no corresponding android impl exists
  cancelNativePayRequestAsync = () =>
    Platform.select({
      ios: () => this.cancelApplePayRequestAsync(),
      android: () => Promise.resolve(),
    })();

  // @deprecated use openNativePaySetup
  openApplePaySetupAsync = () => StripeModule.openApplePaySetup();

  // no corresponding android impl exists
  openNativePaySetupAsync = () =>
    Platform.select({
      ios: () => this.openApplePaySetupAsync(),
      android: () => Promise.resolve(),
    })();

  paymentRequestWithCardFormAsync = (options = {}) => {
    checkInit(this);
    checkArgs(
      types.paymentRequestWithCardFormOptionsPropTypes,
      options,
      'options',
      'Stripe.paymentRequestWithCardForm'
    );
    return StripeModule.paymentRequestWithCardForm({
      ...options,
      theme: processTheme(options.theme),
    });
  };

  createTokenWithCardAsync = (params = {}) => {
    checkInit(this);
    checkArgs(
      types.createTokenWithCardParamsPropTypes,
      params,
      'params',
      'Stripe.createTokenWithCard'
    );
    return StripeModule.createTokenWithCard(params);
  };

  createTokenWithBankAccountAsync = (params = {}) => {
    checkInit(this);
    checkArgs(
      types.createTokenWithBankAccountParamsPropTypes,
      params,
      'params',
      'Stripe.createTokenWithBankAccount'
    );
    return StripeModule.createTokenWithBankAccount(params);
  };

  createSourceWithParamsAsync = (params = {}) => {
    checkInit(this);
    checkArgs(
      types.createSourceWithParamsPropType,
      params,
      'params',
      'Stripe.createSourceWithParams'
    );
    return StripeModule.createSourceWithParams(params);
  };
}

export default new Stripe();
