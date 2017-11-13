// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent;

import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.common.JavascriptException;

import host.exp.expoview.Exponent;

@DoNotStrip
public class ReactNativeStaticHelpers {

  private static String sBundleUrl = null;

  public static void setBundleUrl(final String bundleUrl) {
    sBundleUrl = bundleUrl;
  }

  @DoNotStrip
  public static String getBundleUrlForActivityId(final int activityId, String host, String jsModulePath, boolean devMode, boolean jsMinify) {
    try {
      return (String) Class.forName("host.exp.exponent.kernel.Kernel")
          .getMethod("getBundleUrlForActivityId", int.class, String.class, String.class, boolean.class, boolean.class)
          .invoke(null, activityId, host, jsModulePath, devMode, jsMinify);
    } catch (Exception e) {
      return sBundleUrl;
    }
  }

  // <= SDK 21
  @DoNotStrip
  public static String getBundleUrlForActivityId(final int activityId, String host, String jsModulePath, boolean devMode, boolean hmr, boolean jsMinify) {
    try {
      return (String) Class.forName("host.exp.exponent.kernel.Kernel")
          .getMethod("getBundleUrlForActivityId", int.class, String.class, String.class, boolean.class, boolean.class, boolean.class)
          .invoke(null, activityId, host, jsModulePath, devMode, hmr, jsMinify);
    } catch (Exception e) {
      return sBundleUrl;
    }
  }

  @DoNotStrip
  public static void handleReactNativeError(String errorMessage, Object detailsUnversioned,
                                            Integer exceptionId, Boolean isFatal) {
    try {
      Class.forName("host.exp.exponent.kernel.Kernel").getMethod("handleReactNativeError", String.class, Object.class, Integer.class, Boolean.class).invoke(null, errorMessage, detailsUnversioned, exceptionId, isFatal);
    } catch (Exception e) {
      throw new JavascriptException(errorMessage);
    }
  }

  @DoNotStrip
  public static void handleReactNativeError(Throwable throwable, String errorMessage, Object detailsUnversioned,
                                            Integer exceptionId, Boolean isFatal) {
    try {
      Class.forName("host.exp.exponent.kernel.Kernel").getMethod("handleReactNativeError", Throwable.class, String.class, Object.class, Integer.class, Boolean.class).invoke(null, throwable, errorMessage, detailsUnversioned, exceptionId, isFatal);
    } catch (Exception e) {
      throw new JavascriptException(errorMessage);
    }
  }

  @DoNotStrip
  public static String getBundleSourceForPath(final String path) {
    try {
      return Exponent.getInstance().getBundleSource(path);
    } catch (Exception e) {
      return null;
    }
  }
}
