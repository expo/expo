// Copyright 2015-present 650 Industries. All rights reserved.

package abi5_0_0.host.exp.exponent.modules;

import android.content.Context;
import android.content.res.Resources;
import android.support.annotation.Nullable;
import android.util.DisplayMetrics;

import java.util.Map;

import abi5_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi5_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi5_0_0.com.facebook.react.common.MapBuilder;

import javax.inject.Inject;

import host.exp.exponent.ExponentApplication;
import host.exp.exponent.storage.ExponentSharedPreferences;

public class ExponentConstantsModule extends ReactContextBaseJavaModule {

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  private int mStatusBarHeight = 0;
  private final Map<String, Object> mExperienceProperties;

  private static int convertPixelsToDp(float px, Context context) {
    Resources resources = context.getResources();
    DisplayMetrics metrics = resources.getDisplayMetrics();
    float dp = px / (metrics.densityDpi / 160f);
    return (int) dp;
  }

  public ExponentConstantsModule(
      ReactApplicationContext reactContext,
      ExponentApplication application,
      Map<String, Object> experienceProperties) {
    super(reactContext);
    application.getAppComponent().inject(this);

    int resourceId = application.getResources().getIdentifier("status_bar_height", "dimen", "android");
    if (resourceId > 0) {
      int statusBarHeightPixels = application.getResources().getDimensionPixelSize(resourceId);
      // Convert from pixels to dip
      mStatusBarHeight = convertPixelsToDp(statusBarHeightPixels, application);
    }
    mExperienceProperties = experienceProperties;
  }

  @Override
  public String getName() {
    return "ExponentConstants";
  }

  @Nullable
  @Override
  public Map<String, Object> getConstants() {
    Map<String, Object> constants = MapBuilder.<String, Object>of(
        "statusBarHeight", mStatusBarHeight,
        "deviceUUID", mExponentSharedPreferences.getOrCreateUUID()
    );
    if (mExperienceProperties != null) {
      constants.putAll(mExperienceProperties);
    }
    return constants;
  }
}
