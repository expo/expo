// @flow
import { NativeModulesProxy, EventEmitter, Platform } from 'expo-core';
const { ExpoLocalization } = NativeModulesProxy;

type NativeEvent = {
  locale: string,
  locales: Array<string>,
  timezone: string,
  isoCurrencyCodes: ?Array<string>,
  country: ?string,
  isRTL: boolean,
};

type Listener = (event: NativeEvent) => void;

type Subscription = {
  remove: () => void,
};

class LocalizationModule {
  _nativeEmitter: ?EventEmitter;
  _nativeEventName: string = 'Expo.onLocaleUpdated';

  locale: string;
  locales: Array<string>;
  timezone: string;
  isoCurrencyCodes: ?Array<string>;
  country: ?string;
  isRTL: boolean;

  constructor() {
    this._syncLocals(ExpoLocalization);
    if (Platform.OS === 'android') {
      this._nativeEmitter = new EventEmitter(ExpoLocalization);
      // TODO: Bacon: Need a way to destory this listener
      this._localSubscription = this.addListener(this._syncLocals);
    }
  }

  _syncLocals = ({ locale, locales, timezone, isoCurrencyCodes, country, isRTL }: NativeEvent) => {
    this.locale = locale;
    this.locales = locales;
    this.timezone = timezone;
    this.isoCurrencyCodes = isoCurrencyCodes;
    this.country = country;
    this.isRTL = isRTL;
  };

  addListener(listener: Listener): ?Subscription {
    if (!!this._nativeEmitter) {
      let subscription = this._nativeEmitter.addListener(this._nativeEventName, listener);
      subscription.remove = () => this.removeSubscription(subscription);
      return subscription;
    } else {
      return { remove: function() {} };
    }
  }

  removeAllListeners(): void {
    if (!!this._nativeEmitter) this._nativeEmitter.removeAllListeners(this._nativeEventName);
  }

  removeSubscription(subscription: Subscription): void {
    if (!!this._nativeEmitter) this._nativeEmitter.removeSubscription(subscription);
  }
}

export default new LocalizationModule();
