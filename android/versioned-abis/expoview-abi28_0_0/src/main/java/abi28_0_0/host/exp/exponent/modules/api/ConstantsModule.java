// Copyright 2015-present 650 Industries. All rights reserved.

package abi28_0_0.host.exp.exponent.modules.api;

import android.content.Context;
import android.content.res.Resources;
import android.os.Build;
import android.support.annotation.Nullable;
import android.util.DisplayMetrics;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.facebook.device.yearclass.YearClass;
import abi28_0_0.com.facebook.react.bridge.Promise;
import abi28_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi28_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi28_0_0.com.facebook.react.bridge.ReactMethod;

import org.json.JSONObject;

import javax.inject.Inject;

import host.exp.exponent.Constants;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.ExpoViewKernel;
import host.exp.exponent.kernel.KernelConstants;
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
      Map<String, Object> experienceProperties,
      JSONObject manifest) {
    super(reactContext);
    NativeModuleDepsProvider.getInstance().inject(ConstantsModule.class, this);

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
    constants.put("expoVersion", ExpoViewKernel.getInstance().getVersionName());
    constants.put("statusBarHeight", mStatusBarHeight);
    constants.put("deviceYearClass", YearClass.get(getReactApplicationContext()));
    constants.put("deviceId", mExponentSharedPreferences.getOrCreateUUID());
    constants.put("deviceName", Build.MODEL);
    constants.put("manifest", mManifest.toString());
    constants.put("isDevice", !isRunningOnGenymotion() && !isRunningOnStockEmulator());
    constants.put("systemFonts", getSystemFonts());
    if (mExperienceProperties != null) {
      constants.put("appOwnership", getAppOwnership(mExperienceProperties));
      constants.putAll(mExperienceProperties);
    }
    constants.put("systemVersion", Build.VERSION.RELEASE);

    Map<String, Object> platform = new HashMap<>();
    Map<String, Object> androidPlatform = new HashMap<>();

    androidPlatform.put("versionCode", Constants.ANDROID_VERSION_CODE);

    platform.put("android", androidPlatform);
    constants.put("platform", platform);
    return constants;
  }

  private static boolean isRunningOnGenymotion() {
    return Build.FINGERPRINT.contains("vbox");
  }

  private static boolean isRunningOnStockEmulator() {
    return Build.FINGERPRINT.contains("generic");
  }

  public static String getAppOwnership(Map<String, Object> experienceProperties) {
    if (experienceProperties.containsKey(KernelConstants.MANIFEST_URL_KEY)) {
      String manifestUrl = (String) experienceProperties.get(KernelConstants.MANIFEST_URL_KEY);

      if (Constants.INITIAL_URL == null) {
        return "expo";
      } else if (manifestUrl.equals(Constants.INITIAL_URL)) {
        return "standalone";
      } else {
        return "guest";
      }
    } else {
      return "expo";
    }
  }

  private List<String> getSystemFonts() {
    // From https://github.com/dabit3/react-native-fonts
    List<String> result = new ArrayList<>();
    result.add("normal");
    result.add("notoserif");
    result.add("sans-serif");
    result.add("sans-serif-light");
    result.add("sans-serif-thin");
    result.add("sans-serif-condensed");
    result.add("sans-serif-medium");
    result.add("serif");
    result.add("Roboto");
    result.add("monospace");
    return result;
  }

  @ReactMethod
  public void getWebViewUserAgentAsync(Promise promise) {
    String userAgent = System.getProperty("http.agent");
    promise.resolve(userAgent);
  }
}
