import { NativeModulesProxy } from 'expo-core';
import processTheme from './utils/processTheme';
import checkArgs from './utils/checkArgs';
import checkInit from './utils/checkInit';
import * as types from './utils/types';

const { TPSStripeManager } = NativeModulesProxy;

class Stripe {
  stripeInitialized = false;

  constructor() {
    if (TPSStripeManager) {
      // Error domain
      this.TPSErrorDomain = TPSStripeManager.TPSErrorDomain;

      // Error codes
      this.TPSErrorCodeApplePayNotConfigured = TPSStripeManager.TPSErrorCodeApplePayNotConfigured;
      this.TPSErrorCodePreviousRequestNotCompleted =
        TPSStripeManager.TPSErrorCodePreviousRequestNotCompleted;
      this.TPSErrorCodeUserCancel = TPSStripeManager.TPSErrorCodeUserCancel;
    }
  }

  setOptionsAsync = (options = {}) => {
    checkArgs(types.setOptionsOptionsPropTypes, options, 'options', 'Stripe.setOptions');
    this.stripeInitialized = true;
    return TPSStripeManager.init(options);
  };

  deviceSupportsApplePayAsync = () => TPSStripeManager.deviceSupportsApplePay();

  canMakeApplePayPaymentsAsync = (options = {}) => {
    checkArgs(
      types.canMakeApplePayPaymentsOptionsPropTypes,
      options,
      'options',
      'Stripe.canMakeApplePayPayments'
    );
    return TPSStripeManager.canMakeApplePayPayments(options);
  };

  paymentRequestWithApplePayAsync = (items = [], options = {}) => {
    checkInit(this);
    return TPSStripeManager.paymentRequestWithApplePay(items, options);
  };

  completeApplePayRequestAsync = () => {
    checkInit(this);
    return TPSStripeManager.completeApplePayRequest();
  };

  cancelApplePayRequestAsync = () => {
    checkInit(this);
    return TPSStripeManager.cancelApplePayRequest();
  };

  openApplePaySetupAsync = () => TPSStripeManager.openApplePaySetup();

  paymentRequestWithCardFormAsync = (options = {}) => {
    checkInit(this);
    checkArgs(
      types.paymentRequestWithCardFormOptionsPropTypes,
      options,
      'options',
      'Stripe.paymentRequestWithCardForm'
    );
    return TPSStripeManager.paymentRequestWithCardForm({
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
    return TPSStripeManager.createTokenWithCard(params);
  };

  createTokenWithBankAccountAsync = (params = {}) => {
    checkInit(this);
    checkArgs(
      types.createTokenWithBankAccountParamsPropTypes,
      params,
      'params',
      'Stripe.createTokenWithBankAccount'
    );
    return TPSStripeManager.createTokenWithBankAccount(params);
  };

  createSourceWithParamsAsync = (params = {}) => {
    checkInit(this);
    checkArgs(
      types.createSourceWithParamsPropType,
      params,
      'params',
      'Stripe.createSourceWithParams'
    );
    return TPSStripeManager.createSourceWithParams(params);
  };
}

export default new Stripe();
