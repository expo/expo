// Copyright 2015-present 650 Industries. All rights reserved.

package versioned.host.exp.exponent.modules.internal;


import android.net.Uri;

import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.intent.IntentModule;

import java.net.URL;
import java.util.Map;

import javax.inject.Inject;

import host.exp.exponent.Constants;
import host.exp.exponent.ExponentApplication;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.kernel.Kernel;

public class ExponentIntentModule extends IntentModule {

  private static final String TAG = ExponentIntentModule.class.getSimpleName();

  @Inject
  Kernel mKernel;

  private Map<String, Object> mExperienceProperties;

  public ExponentIntentModule(ReactApplicationContext reactContext, ExponentApplication application, Map<String, Object> experienceProperties) {
    super(reactContext);
    application.getAppComponent().inject(this);

    mExperienceProperties = experienceProperties;
  }

  @Override
  public boolean canOverrideExistingModule() {
    return true;
  }

  @ReactMethod
  public void getInitialURL(Promise promise) {
    try {
      promise.resolve(mExperienceProperties.get(Kernel.INTENT_URI_KEY));
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
    mKernel.openExperience(new Kernel.ExperienceOptions(url, url, null));
  }

  @ReactMethod
  public void canOpenURL(String url, Promise promise) {
    super.canOpenURL(url, promise);
  }
}
