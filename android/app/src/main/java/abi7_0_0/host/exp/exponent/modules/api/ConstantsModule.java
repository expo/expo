// Copyright 2015-present 650 Industries. All rights reserved.

package abi7_0_0.host.exp.exponent.modules.api;

import android.content.Context;
import android.content.res.Resources;
import android.os.Build;
import android.support.annotation.Nullable;
import android.util.DisplayMetrics;

import java.util.Map;
import java.util.UUID;

import com.facebook.device.yearclass.YearClass;
import abi7_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi7_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi7_0_0.com.facebook.react.common.MapBuilder;

import org.json.JSONObject;

import javax.inject.Inject;

import host.exp.exponent.ExponentApplication;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.kernel.Kernel;
import host.exp.exponent.storage.ExponentSharedPreferences;

public class ConstantsModule extends ReactContextBaseJavaModule {

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  private int mStatusBarHeight = 0;
  private final Map<String, Object> mExperienceProperties;
  private String mSessionId = UUID.randomUUID().toString();
  private JSONObject mManifest;

  private static int convertPixelsToDp(float px, Context context) {
    Resources resources = context.getResources();
    DisplayMetrics metrics = resources.getDisplayMetrics();
    float dp = px / (metrics.densityDpi / 160f);
    return (int) dp;
  }

  public ConstantsModule(
      ReactApplicationContext reactContext,
      ExponentApplication application,
      Map<String, Object> experienceProperties,
      JSONObject manifest) {
    super(reactContext);
    application.getAppComponent().inject(this);

    mManifest = manifest;

    if (!manifest.has(ExponentManifest.MANIFEST_STATUS_BAR_COLOR)) {
      int resourceId = application.getResources().getIdentifier("status_bar_height", "dimen", "android");
      if (resourceId > 0) {
        int statusBarHeightPixels = application.getResources().getDimensionPixelSize(resourceId);
        // Convert from pixels to dip
        mStatusBarHeight = convertPixelsToDp(statusBarHeightPixels, application);
      }
    } else {
      mStatusBarHeight = 0;
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
        "sessionId", mSessionId,
        "exponentVersion", Kernel.getVersionName(),
        "statusBarHeight", mStatusBarHeight,
        "deviceYearClass", YearClass.get(getReactApplicationContext()),
        "deviceId", mExponentSharedPreferences.getOrCreateUUID(),
        "deviceName", Build.MODEL,
        "manifest", mManifest.toString()
    );
    if (mExperienceProperties != null) {
      constants.putAll(mExperienceProperties);
    }
    return constants;
  }
}
