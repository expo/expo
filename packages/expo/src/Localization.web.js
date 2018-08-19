// @flow
/* global Intl */

function getCurrentDeviceCountryAsync(): Promise<string> {
  let lang = navigator.language;
  if (typeof lang === 'undefined') {
    // $FlowFixMe: non-standard property
    lang = navigator.browserLanguage;
  }
  return Promise.resolve(lang);
}

function getCurrentLocaleAsync(): Promise<string> {
  return Promise.resolve(navigator.languages[0]);
}

function getCurrentTimeZoneAsync(): Promise<string> {
  return window.Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getPreferredLocalesAsync(): Promise<string[]> {
  return Promise.resolve(navigator.languages);
}

function getISOCurrencyCodesAsync(): Promise<string[]> {
  return Promise.resolve([]);
}

export default {
  getCurrentDeviceCountryAsync,
  getCurrentLocaleAsync,
  getCurrentTimeZoneAsync,
  getPreferredLocalesAsync,
  getISOCurrencyCodesAsync,
};
