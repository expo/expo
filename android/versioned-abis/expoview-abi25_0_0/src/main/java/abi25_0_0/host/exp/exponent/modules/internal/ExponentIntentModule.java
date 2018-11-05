// Copyright 2015-present 650 Industries. All rights reserved.

package abi25_0_0.host.exp.exponent.modules.internal;

import android.net.Uri;

import abi25_0_0.com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import abi25_0_0.com.facebook.react.bridge.Promise;
import abi25_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi25_0_0.com.facebook.react.bridge.ReactMethod;
import abi25_0_0.com.facebook.react.modules.intent.IntentModule;

import java.util.Map;

import host.exp.exponent.Constants;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.KernelConstants;
import host.exp.exponent.kernel.KernelProvider;

public class ExponentIntentModule extends IntentModule {

  private static final String TAG = ExponentIntentModule.class.getSimpleName();

  private Map<String, Object> mExperienceProperties;

  public ExponentIntentModule(ReactApplicationContext reactContext, Map<String, Object> experienceProperties) {
    super(reactContext);
    NativeModuleDepsProvider.getInstance().inject(ExponentIntentModule.class, this);

    mExperienceProperties = experienceProperties;
  }

  @Override
  public boolean canOverrideExistingModule() {
    return true;
  }

  @ReactMethod
  public void getInitialURL(Promise promise) {
    try {
      promise.resolve(mExperienceProperties.get(KernelConstants.INTENT_URI_KEY));
    } catch (Exception e) {
      promise.reject(new JSApplicationIllegalArgumentException(
          "Could not get the initial URL : " + e.getMessage()));
    }
  }

  @ReactMethod
  public void openURL(String url, Promise promise) {
    if (url == null || url.isEmpty()) {
      promise.reject(new JSApplicationIllegalArgumentException("Invalid URL: " + url));
      return;
    }

    try {
      Uri uri = Uri.parse(url);
      String scheme = uri.getScheme();
      if ("exp".equals(scheme) || "exps".equals(scheme)) {
        handleExpUrl(url);
        return;
      }

      if (Constants.SHELL_APP_SCHEME != null && Constants.SHELL_APP_SCHEME.equals(scheme)) {
        handleExpUrl(url);
        return;
      }

      String host = uri.getHost();
      if ("exp.host".equals(host) || host.endsWith("exp.direct")) {
        handleExpUrl(url);
        return;
      }
    } catch (Throwable e) {
      EXL.e(TAG, e.toString());
    }

    super.openURL(url, promise);
  }

  private void handleExpUrl(final String url) {
    KernelProvider.getInstance().openExperience(new KernelConstants.ExperienceOptions(url, url, null));
  }

  @ReactMethod
  public void canOpenURL(String url, Promise promise) {
    super.canOpenURL(url, promise);
  }
}
