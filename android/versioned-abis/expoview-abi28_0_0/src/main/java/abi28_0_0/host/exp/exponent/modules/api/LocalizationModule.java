// Copyright 2015-present 650 Industries. All rights reserved.

package abi28_0_0.host.exp.exponent.modules.api;

import android.content.res.Resources;
import android.os.Build;
import android.os.LocaleList;

import abi28_0_0.com.facebook.react.bridge.Promise;
import abi28_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi28_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi28_0_0.com.facebook.react.bridge.ReactMethod;
import abi28_0_0.com.facebook.react.bridge.WritableArray;
import abi28_0_0.com.facebook.react.bridge.Arguments;

import java.util.Currency;
import java.util.Locale;
import java.util.Set;
import java.util.TimeZone;

import static java.util.Currency.getAvailableCurrencies;


public class LocalizationModule extends ReactContextBaseJavaModule {

  public LocalizationModule(ReactApplicationContext reactContext) {
    super(reactContext);

  }
  @Override
  public String getName() {
    return "ExponentLocalization";
  }

  @ReactMethod
  public void getCurrentLocaleAsync(final Promise promise) {
    promise.resolve(getCurrentLocale().toString());
  }

  private Locale getCurrentLocale() {
    return getReactApplicationContext().getResources().getConfiguration().locale;
  }

  @ReactMethod
  public void getPreferredLocalesAsync(final Promise promise) {
    WritableArray langs =  Arguments.createArray();
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      LocaleList locales = getReactApplicationContext().getResources().getConfiguration().getLocales();
      for (int i = 0; i < locales.size(); i++) {
         Locale locale = locales.get(i);
         langs.pushString(locale.toString());
      }
    } else {
      String[] s = Resources.getSystem().getAssets().getLocales();
      for (String i : s) {
        langs.pushString(i);
      }
    }
    promise.resolve(langs);
  }

  @ReactMethod
  public void getISOCurrencyCodesAsync(final Promise promise) {
    final WritableArray langs =  Arguments.createArray();
    final Set<Currency> availableCurrencies = getAvailableCurrencies();
    for (Currency handle : availableCurrencies) {
      langs.pushString(handle.getCurrencyCode());
    }
    promise.resolve(langs);
  }

  @ReactMethod
  public void getCurrentDeviceCountryAsync(final Promise promise) {
    Locale current = getCurrentLocale();
    String country = current.getCountry();
    if (country == null || country.length() == 0) {
      promise.reject("E_NO_DEVICE_COUNTRY", "This device does not indicate its country");
    } else {
      promise.resolve(country);
    }
  }

  @ReactMethod
  public void getCurrentTimeZoneAsync(final Promise promise) {
    promise.resolve(TimeZone.getDefault().getID());
  }
}
