// @flow

import { NativeModulesProxy, NativeEventEmitter, Platform } from 'expo-core';
const { ExpoLocalization } = NativeModulesProxy;

type NativeEvent = {
    locale: string,
    locales: Array<string>,
    timezone: string,
    isoCurrencyCodes: ?Array<string>,
    country: ?Array<string>,
};

type Watcher = (eventData: NativeEvent) => any;

type NativeEventName = 'change';

type ExpoLocalizationModule = {
  _nativeEventWatchers?: Set<Watcher>,
  _nativeEmitter?: NativeEventEmitter,

  locale: string,
  locales: Array<string>,
  timezone: string,
  isoCurrencyCodes: ?Array<string>,
  country: ?Array<string>,

  addListener: (nativeEventName: NativeEventName, watcher: Watcher) => void,
  removeListener: (nativeEventName: NativeEventName, watcher: Watcher) => void,
};

let LocalizationModule: ExpoLocalizationModule = {
  locale: ExpoLocalization.locale,
  locales: ExpoLocalization.locales,
  timezone: ExpoLocalization.timezone,
  isoCurrencyCodes: ExpoLocalization.isoCurrencyCodes,
  country: ExpoLocalization.country,
  addListener: function(nativeEventName: NativeEvent, watcher: Watcher) {
    if (nativeEventName !== 'change') {
      throw new Error(`Cannot subscribe to event: ${nativeEventName}`);
    } else if (!!this._nativeEventWatchers && !this._nativeEventWatchers.has(watcher)) {
      this._nativeEventWatchers.add(watcher);
    }
  },
  removeListener: function(nativeEventName: NativeEvent, watcher: Watcher) {
    if (nativeEventName !== 'change') {
      throw new Error(`Cannot unsubscribe to event: ${nativeEventName}`);
    } else if (!!this._nativeEventWatchers && this._nativeEventWatchers.has(watcher)) {
      this._nativeEventWatchers.delete(watcher);
    }
  },
};

if (Platform.OS === 'android') {
  LocalizationModule._nativeEventWatchers = new Set();

  LocalizationModule._nativeEmitter = new NativeEventEmitter(ExpoLocalization);
  LocalizationModule._nativeEmitter.addListener('Expo.onLocaleUpdated', (event: NativeEvent) => {
    LocalizationModule.locale = event.locale;
    LocalizationModule.locales = event.locales;
    LocalizationModule.timezone = event.timezone;
    LocalizationModule.isoCurrencyCodes = event.isoCurrencyCodes;
    LocalizationModule.country = event.country;

    if (LocalizationModule._nativeEventWatchers)
      LocalizationModule._nativeEventWatchers.forEach(callback => callback(event));
  });
}

export default LocalizationModule;
