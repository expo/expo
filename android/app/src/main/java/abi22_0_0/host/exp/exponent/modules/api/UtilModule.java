// Copyright 2015-present 650 Industries. All rights reserved.

package abi22_0_0.host.exp.exponent.modules.api;

import android.content.Intent;
import android.support.annotation.NonNull;

import abi22_0_0.com.facebook.react.bridge.Promise;
import abi22_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi22_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi22_0_0.com.facebook.react.bridge.ReactMethod;

import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;

import javax.inject.Inject;

import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.KernelConstants;
import host.exp.exponent.kernel.KernelProvider;

public class UtilModule extends ReactContextBaseJavaModule {

  private final Map<String, Object> mExperienceProperties;

  public UtilModule(ReactApplicationContext reactContext,
                    Map<String, Object> experienceProperties) {
    super(reactContext);
    NativeModuleDepsProvider.getInstance().inject(UtilModule.class, this);

    mExperienceProperties = experienceProperties;
  }

  @Override
  public String getName() {
    return "ExponentUtil";
  }

  @ReactMethod
  public void shareAsync(@NonNull final String prompt, @NonNull final String subject, final String contents, final Promise promise) {
    Intent intent = new Intent(android.content.Intent.ACTION_SEND);
    intent.setType("text/plain");
    intent.putExtra(Intent.EXTRA_SUBJECT, subject);
    if (contents != null) {
      intent.putExtra(Intent.EXTRA_TEXT, contents);
    }
    getCurrentActivity().startActivity(Intent.createChooser(intent, prompt));
    promise.resolve(true);
  }

  @ReactMethod
  public void reload() {
    KernelProvider.getInstance().reloadVisibleExperience((String) mExperienceProperties.get(KernelConstants.MANIFEST_URL_KEY));
  }

  @ReactMethod
  public void getCurrentLocaleAsync(final Promise promise) {
    promise.resolve(getReactApplicationContext().getResources().getConfiguration().locale.toString());
  }

  @ReactMethod
  public void getCurrentDeviceCountryAsync(final Promise promise) {
    Locale current = getReactApplicationContext().getResources().getConfiguration().locale;
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
