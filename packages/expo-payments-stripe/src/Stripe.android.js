import { NativeModulesProxy } from 'expo-core';
import checkArgs from './utils/checkArgs';
import checkInit from './utils/checkInit';
import * as types from './utils/types';

const { StripeModule } = NativeModulesProxy;

class Stripe {
  stripeInitialized = false;

  setOptionsAsync = (options = {}) => {
    checkArgs(types.setOptionsOptionsPropTypes, options, 'options', 'Stripe.setOptions');
    this.stripeInitialized = true;
    return StripeModule.init(options);
  };

  deviceSupportsAndroidPayAsync = () => StripeModule.deviceSupportsAndroidPay();

  canMakeAndroidPayPaymentsAsync = () => StripeModule.canMakeAndroidPayPayments();

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

  paymentRequestWithCardFormAsync = (options = {}) => {
    checkInit(this);
    checkArgs(
      types.paymentRequestWithCardFormOptionsPropTypes,
      options,
      'options',
      'Stripe.paymentRequestWithCardForm'
    );
    return StripeModule.paymentRequestWithCardForm(options);
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
