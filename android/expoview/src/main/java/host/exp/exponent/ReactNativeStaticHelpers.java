// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent;


import android.util.Log;

import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.common.JavascriptException;

import java.lang.reflect.Method;
import java.util.concurrent.TimeUnit;

import javax.annotation.Nullable;

import okhttp3.CookieJar;
import okhttp3.OkHttpClient;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.network.ExponentNetwork;
import host.exp.expoview.Exponent;

@DoNotStrip
public class ReactNativeStaticHelpers {

  private static String TAG = ReactNativeStaticHelpers.class.getSimpleName();

  private static String sBundleUrl = null;

  public static void setBundleUrl(final String bundleUrl) {
    sBundleUrl = bundleUrl;
  }

  @DoNotStrip
  public static void reloadFromManifest(final int activityId) {
    try {
      Class.forName("host.exp.exponent.kernel.Kernel")
          .getMethod("reloadVisibleExperience", int.class)
          .invoke(null, activityId);
    } catch(Exception e) {
      Log.e("reloadFromManifest", "Unable to reload visible experience", e);
    }
  }

  @DoNotStrip
  public static String getBundleUrlForActivityId(final int activityId, String mainModuleId,
                                                 String bundleTypeId, String host, boolean devMode,
                                                 boolean jsMinify) {
    try {
      return (String) Class.forName("host.exp.exponent.kernel.Kernel")
          .getMethod("getBundleUrlForActivityId", int.class, String.class, String.class, String.class, boolean.class, boolean.class)
          .invoke(null, activityId, mainModuleId, bundleTypeId, host, devMode, jsMinify);
    } catch (Exception e) {
      return sBundleUrl;
    }
  }

  // <= SDK 25
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
  public static void handleReactNativeError(String errorMessage, Object stackUnversioned,
                                            Integer exceptionId, Boolean isFatal) {
    try {
      Class.forName("host.exp.exponent.kernel.Kernel").getMethod("handleReactNativeError", String.class, Object.class, Integer.class, Boolean.class).invoke(null, errorMessage, stackUnversioned, exceptionId, isFatal);
    } catch (Exception e) {
      throw new JavascriptException(errorMessage);
    }
  }

  @DoNotStrip
  public static void handleReactNativeError(Throwable throwable, String errorMessage, Object stackUnversioned,
                                            Integer exceptionId, Boolean isFatal) {
    try {
      Class.forName("host.exp.exponent.kernel.Kernel").getMethod("handleReactNativeError", Throwable.class, String.class, Object.class, Integer.class, Boolean.class).invoke(null, throwable, errorMessage, stackUnversioned, exceptionId, isFatal);
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

  private static @Nullable ExponentNetwork sExponentNetwork;

  public static void setExponentNetwork(ExponentNetwork exponentNetwork) {
    sExponentNetwork = exponentNetwork;
  }

  @DoNotStrip
  public static Object getOkHttpClient(Class callingClass) {
    String version = RNObject.versionForClassname(callingClass.getName());
    Object cookieJar = new RNObject("com.facebook.react.modules.network.ReactCookieJarContainer").loadVersion(version).construct().get();

    OkHttpClient.Builder client = new OkHttpClient.Builder()
        .connectTimeout(0, TimeUnit.MILLISECONDS)
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .writeTimeout(0, TimeUnit.MILLISECONDS)
        .cookieJar((CookieJar) cookieJar)
        .cache(sExponentNetwork.getCache());

    sExponentNetwork.addInterceptors(client);

    // pass the builder through MainApplication so that detached apps can customize it
    try {
      Method m = Class.forName("host.exp.exponent.MainApplication").getMethod("okHttpClientBuilder", OkHttpClient.Builder.class);
      Object returnVal = m.invoke(null, client);
      if (returnVal instanceof OkHttpClient.Builder) {
        client = (OkHttpClient.Builder) returnVal;
      } else {
        throw new Exception("MainApplication.okHttpClientBuilder returned an object of type " + returnVal.getClass().getName());
      }
    } catch (NoSuchMethodException ex) {
      // ignore this and fall back to previous client
    } catch (Exception e) {
      // just fall back to previous client
      EXL.e(TAG, "Falling back to default OkHttpClient builder: " + e.getMessage());
    }
    return client.build();
  }
}
