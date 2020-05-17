import { NativeModulesProxy, UnavailabilityError } from '@unimodules/core';
import { Platform } from 'react-native';

import errorCodes from './errorCodes';
import checkArgs from './utils/checkArgs';
import processTheme from './utils/processTheme';
import * as types from './utils/types';
import * as validators from './utils/validators';

const { StripeModule } = NativeModulesProxy;

function checkInit(instance: Stripe) {
  if (!instance.stripeInitialized) {
    throw new Error(
      `You should call init first.\nRead more https://github.com/tipsi/tipsi-stripe#usage`
    );
  }
}

class Stripe {
  stripeInitialized = false;

  setOptionsAsync = (options: types.StripeOptions) => {
    checkArgs(validators.setOptionsOptionsPropTypes, options, 'options', 'Stripe.setOptions');

    this.stripeInitialized = true;

    return StripeModule.init(options, errorCodes);
  };

  // @deprecated use deviceSupportsNativePay
  deviceSupportsAndroidPayAsync = (): Promise<boolean> => StripeModule.deviceSupportsAndroidPay();

  // @deprecated use deviceSupportsNativePay
  deviceSupportsApplePayAsync = (): Promise<boolean> => StripeModule.deviceSupportsApplePay();

  deviceSupportsNativePayAsync = () =>
    Platform.select({
      ios: () => this.deviceSupportsApplePayAsync(),
      android: () => this.deviceSupportsAndroidPayAsync(),
      default: () => Promise.resolve(false),
    })();

  // @deprecated use canMakeNativePayPayments
  canMakeApplePayPaymentsAsync = (
    options: types.CanMakeApplePayPaymentsOptions = {}
  ): Promise<boolean> => {
    checkArgs(
      validators.canMakeApplePayPaymentsOptionsPropTypes,
      options,
      'options',
      'Stripe.canMakeApplePayPayments'
    );
    return StripeModule.canMakeApplePayPayments(options);
  };

  // @deprecated use canMakeNativePayPayments
  canMakeAndroidPayPaymentsAsync = (): Promise<boolean> => StripeModule.canMakeAndroidPayPayments();

  // iOS requires networks array while Android requires nothing
  canMakeNativePayPaymentsAsync = (options: types.CanMakeApplePayPaymentsOptions = {}) =>
    Platform.select({
      ios: () => this.canMakeApplePayPaymentsAsync(options),
      android: () => this.canMakeAndroidPayPaymentsAsync(),
      default: () => Promise.resolve(false),
    })();

  // @deprecated use paymentRequestWithNativePay
  paymentRequestWithAndroidPayAsync = (
    options: types.PaymentRequestWithAndroidPayOptions
  ): Promise<types.AndroidToken> => {
    checkInit(this);
    checkArgs(
      validators.paymentRequestWithAndroidPayOptionsPropTypes,
      options,
      'options',
      'Stripe.paymentRequestWithAndroidPay'
    );
    return StripeModule.paymentRequestWithAndroidPay(options);
  };

  // @deprecated use paymentRequestWithNativePay
  paymentRequestWithApplePayAsync = (
    items: types.PaymentRequestWithApplePayItem[],
    options: types.PaymentRequestWithApplePayOptions
  ): Promise<types.AppleToken> => {
    checkInit(this);
    checkArgs(
      validators.paymentRequestWithApplePayItemsPropTypes,
      { items },
      'items',
      'Stripe.paymentRequestWithApplePay'
    );
    checkArgs(
      validators.paymentRequestWithApplePayOptionsPropTypes,
      options,
      'options',
      'Stripe.paymentRequestWithApplePay'
    );
    return StripeModule.paymentRequestWithApplePay(items, options);
  };

  paymentRequestWithNativePayAsync(
    options: types.PaymentRequestWithApplePayOptions | types.PaymentRequestWithAndroidPayOptions,
    items: types.PaymentRequestWithApplePayItem[] = []
  ) {
    const nativePaymentFunction = Platform.select<
      () => Promise<types.AppleToken | types.AndroidToken>
    >({
      ios: () =>
        this.paymentRequestWithApplePayAsync(
          items,
          options as types.PaymentRequestWithApplePayOptions
        ),
      android: () =>
        this.paymentRequestWithAndroidPayAsync(
          options as types.PaymentRequestWithAndroidPayOptions
        ),
      default: () =>
        Promise.reject(
          new UnavailabilityError('expo-payments-stripe', 'paymentRequestWithNativePayAsync')
        ),
    });
    return nativePaymentFunction();
  }

  // @deprecated use completeNativePayRequest
  completeApplePayRequestAsync = (): Promise<void> => {
    checkInit(this);
    return StripeModule.completeApplePayRequest();
  };

  // no corresponding android impl exists
  completeNativePayRequestAsync = () =>
    Platform.select({
      ios: () => this.completeApplePayRequestAsync(),
      default: () => Promise.resolve(),
    })();

  // @deprecated use cancelNativePayRequest
  cancelApplePayRequestAsync = (): Promise<void> => {
    checkInit(this);
    return StripeModule.cancelApplePayRequestAsync();
  };

  // no corresponding android impl exists
  cancelNativePayRequestAsync = () =>
    Platform.select({
      ios: () => this.cancelApplePayRequestAsync(),
      default: () => Promise.resolve(),
    })();

  // @deprecated use openNativePaySetup
  openApplePaySetupAsync = (): Promise<void> => StripeModule.openApplePaySetup();

  // no corresponding android impl exists
  openNativePaySetupAsync = () =>
    Platform.select({
      ios: () => this.openApplePaySetupAsync(),
      default: () => Promise.resolve(),
    })();

  paymentRequestWithCardFormAsync = (
    options: types.PaymentRequestWithCardFormOptions = {}
  ): Promise<types.AndroidToken | types.AppleToken> => {
    checkInit(this);
    checkArgs(
      validators.paymentRequestWithCardFormOptionsPropTypes,
      options,
      'options',
      'Stripe.paymentRequestWithCardForm'
    );
    return StripeModule.paymentRequestWithCardForm({
      ...options,
      theme: processTheme(options.theme),
    });
  };

  createTokenWithCardAsync = (
    params: types.CreateTokenWithCardOptions
  ): Promise<types.AndroidToken | types.AppleToken> => {
    checkInit(this);
    checkArgs(
      validators.createTokenWithCardParamsPropTypes,
      params,
      'params',
      'Stripe.createTokenWithCard'
    );
    return StripeModule.createTokenWithCard(params);
  };

  createTokenWithBankAccountAsync = (
    params = {}
  ): Promise<types.AndroidToken | types.AppleToken> => {
    checkInit(this);
    checkArgs(
      validators.createTokenWithBankAccountParamsPropTypes,
      params,
      'params',
      'Stripe.createTokenWithBankAccount'
    );
    return StripeModule.createTokenWithBankAccount(params);
  };

  createSourceWithParamsAsync = (
    params: types.CreateSourceWithParamsOptions
  ): Promise<types.Source> => {
    checkInit(this);
    checkArgs(
      validators.createSourceWithParamsPropType,
      params,
      'params',
      'Stripe.createSourceWithParams'
    );
    return StripeModule.createSourceWithParams(params);
  };
}

export default new Stripe();
