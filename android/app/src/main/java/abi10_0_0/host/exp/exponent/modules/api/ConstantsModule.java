// Copyright 2015-present 650 Industries. All rights reserved.

package abi10_0_0.host.exp.exponent.modules.api;

import android.content.Context;
import android.content.res.Resources;
import android.os.Build;
import android.support.annotation.Nullable;
import android.util.DisplayMetrics;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import com.facebook.device.yearclass.YearClass;
import abi10_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi10_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi10_0_0.com.facebook.react.common.MapBuilder;

import org.json.JSONObject;

import javax.inject.Inject;

import host.exp.exponent.Constants;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.Kernel;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.exponentview.Exponent;

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
      Map<String, Object> experienceProperties,
      JSONObject manifest) {
    super(reactContext);
    NativeModuleDepsProvider.getInstance().inject(this);

    mManifest = manifest;

    if (!manifest.has(ExponentManifest.MANIFEST_STATUS_BAR_COLOR)) {
      int resourceId = reactContext.getResources().getIdentifier("status_bar_height", "dimen", "android");
      if (resourceId > 0) {
        int statusBarHeightPixels = reactContext.getResources().getDimensionPixelSize(resourceId);
        // Convert from pixels to dip
        mStatusBarHeight = convertPixelsToDp(statusBarHeightPixels, reactContext);
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
    Map<String, Object> constants = new HashMap<>();
    constants.put("sessionId", mSessionId);
    constants.put("exponentVersion", Kernel.getVersionName());
    constants.put("statusBarHeight", mStatusBarHeight);
    constants.put("deviceYearClass", YearClass.get(getReactApplicationContext()));
    constants.put("deviceId", mExponentSharedPreferences.getOrCreateUUID());
    constants.put("deviceName", Build.MODEL);
    constants.put("manifest", mManifest.toString());
    constants.put("isDevice", !isRunningOnGenymotion() && !isRunningOnStockEmulator());
    if (mExperienceProperties != null) {
      constants.put("appOwnership", getAppOwnership(mExperienceProperties));
      constants.putAll(mExperienceProperties);
    }
    return constants;
  }

  private static boolean isRunningOnGenymotion() {
    return Build.FINGERPRINT.contains("vbox");
  }

  private static boolean isRunningOnStockEmulator() {
    return Build.FINGERPRINT.contains("generic");
  }

  private static String getAppOwnership(Map<String, Object> experienceProperties) {
    if (experienceProperties.containsKey(Kernel.MANIFEST_URL_KEY)) {
      String manifestUrl = (String) experienceProperties.get(Kernel.MANIFEST_URL_KEY);

      if (Constants.INITIAL_URL == null) {
        return "exponent";
      } else if (manifestUrl.equals(Constants.INITIAL_URL)) {
        return "standalone";
      } else {
        return "guest";
      }
    } else {
      return "exponent";
    }
  }
}
