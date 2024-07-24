// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent;

import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.text.TextUtils;

import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import expo.modules.splashscreen.SplashScreenImageResizeMode;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.generated.ExponentBuildConstants;

public class Constants {

  public static class ExpoViewAppConstants {
    public String VERSION_NAME;
    public int ANDROID_VERSION_CODE;
    public boolean FCM_ENABLED;
    public SplashScreenImageResizeMode SPLASH_SCREEN_IMAGE_RESIZE_MODE;
  }

  private static final String TAG = Constants.class.getSimpleName();

  public static String VERSION_NAME = null;
  public static String ABI_VERSIONS;
  public static String SDK_VERSIONS;
  public static List<String> SDK_VERSIONS_LIST;
  public static final String TEMPORARY_SDK_VERSION = ExponentBuildConstants.TEMPORARY_SDK_VERSION;
  public static final String EMBEDDED_KERNEL_PATH = "assets://kernel.android.bundle";
  public static boolean DISABLE_NUX = false;
  public static int ANDROID_VERSION_CODE;
  public static boolean FCM_ENABLED;
  public static SplashScreenImageResizeMode SPLASH_SCREEN_IMAGE_RESIZE_MODE;

  public static void setSdkVersions(List<String> sdkVersions) {
    ABI_VERSIONS = TextUtils.join(",", sdkVersions);

    // NOTE: Currently public-facing SDK versions and internal ABI versions are the same, but
    // eventually we may decouple them
    SDK_VERSIONS = ABI_VERSIONS;
    SDK_VERSIONS_LIST = sdkVersions;
  }

  static {
    List<String> abiVersions = new ArrayList<>();
    if (TEMPORARY_SDK_VERSION != null) {
      abiVersions.add(TEMPORARY_SDK_VERSION);
    }

    setSdkVersions(abiVersions);

    try {
      Class appConstantsClass = Class.forName("host.exp.exponent.generated.AppConstants");
      ExpoViewAppConstants appConstants = (ExpoViewAppConstants) appConstantsClass.getMethod("get").invoke(null);
      VERSION_NAME = appConstants.VERSION_NAME;
      ANDROID_VERSION_CODE = appConstants.ANDROID_VERSION_CODE;
      FCM_ENABLED = appConstants.FCM_ENABLED;
      SPLASH_SCREEN_IMAGE_RESIZE_MODE = appConstants.SPLASH_SCREEN_IMAGE_RESIZE_MODE;
    } catch (ClassNotFoundException e) {
      e.printStackTrace();
    } catch (IllegalAccessException e) {
      e.printStackTrace();
    } catch (NoSuchMethodException e) {
      e.printStackTrace();
    } catch (InvocationTargetException e) {
      e.printStackTrace();
    }
  }

  public static final boolean DEBUG_COLD_START_METHOD_TRACING = false;
  public static final boolean DEBUG_MANIFEST_METHOD_TRACING = false;
  public static final boolean DEBUG_METHOD_TRACING = DEBUG_COLD_START_METHOD_TRACING || DEBUG_MANIFEST_METHOD_TRACING;
  public static final boolean ENABLE_LEAK_CANARY = false;
  public static final boolean WRITE_BUNDLE_TO_LOG = false;
  public static final boolean WAIT_FOR_DEBUGGER = false;

  public static String getVersionName(Context context) {
    if (VERSION_NAME != null) {
      // This will be set in shell apps
      return VERSION_NAME;
    } else {
      try {
        PackageInfo pInfo = context.getPackageManager().getPackageInfo(context.getPackageName(), 0);
        return pInfo.versionName;
      } catch (PackageManager.NameNotFoundException e) {
        EXL.e(TAG, e.toString());
        return "";
      }
    }
  }

  private static boolean sIsTest = false;

  public static void setInTest() {
    sIsTest = true;
  }

  public static boolean isTest() {
    return sIsTest;
  }
}
