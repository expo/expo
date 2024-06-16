// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent

import android.util.Log
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.common.JavascriptException
import host.exp.exponent.kernel.KernelNetworkInterceptor
import host.exp.exponent.network.ExponentNetwork
import host.exp.expoview.Exponent
import okhttp3.CookieJar
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit

@DoNotStrip
object ReactNativeStaticHelpers {
  private val TAG = ReactNativeStaticHelpers::class.java.simpleName

  @DoNotStrip
  @JvmStatic fun reloadFromManifest(activityId: Int) {
    try {
      Class.forName("host.exp.exponent.kernel.Kernel")
        .getMethod("reloadVisibleExperience", Int::class.javaPrimitiveType)
        .invoke(null, activityId)
    } catch (e: Exception) {
      Log.e("reloadFromManifest", "Unable to reload visible experience", e)
    }
  }

  @DoNotStrip
  @JvmStatic fun getBundleUrlForActivityId(
    activityId: Int,
    host: String?,
    mainModuleId: String?,
    bundleTypeId: String?,
    devMode: Boolean,
    jsMinify: Boolean
  ): String? {
    return try {
      Class.forName("host.exp.exponent.kernel.Kernel")
        .getMethod(
          "getBundleUrlForActivityId",
          Int::class.javaPrimitiveType,
          String::class.java,
          String::class.java,
          String::class.java,
          Boolean::class.javaPrimitiveType,
          Boolean::class.javaPrimitiveType
        )
        .invoke(null, activityId, host, mainModuleId, bundleTypeId, devMode, jsMinify) as String
    } catch (e: Exception) {
      null
    }
  }

  // <= SDK 25
  @DoNotStrip
  @JvmStatic fun getBundleUrlForActivityId(
    activityId: Int,
    host: String?,
    jsModulePath: String?,
    devMode: Boolean,
    jsMinify: Boolean
  ): String? {
    return try {
      Class.forName("host.exp.exponent.kernel.Kernel")
        .getMethod(
          "getBundleUrlForActivityId",
          Int::class.javaPrimitiveType,
          String::class.java,
          String::class.java,
          Boolean::class.javaPrimitiveType,
          Boolean::class.javaPrimitiveType
        )
        .invoke(null, activityId, host, jsModulePath, devMode, jsMinify) as String
    } catch (e: Exception) {
      null
    }
  }

  // <= SDK 21
  @DoNotStrip
  @JvmStatic fun getBundleUrlForActivityId(
    activityId: Int,
    host: String?,
    jsModulePath: String?,
    devMode: Boolean,
    hmr: Boolean,
    jsMinify: Boolean
  ): String? {
    return try {
      Class.forName("host.exp.exponent.kernel.Kernel")
        .getMethod(
          "getBundleUrlForActivityId",
          Int::class.javaPrimitiveType,
          String::class.java,
          String::class.java,
          Boolean::class.javaPrimitiveType,
          Boolean::class.javaPrimitiveType,
          Boolean::class.javaPrimitiveType
        )
        .invoke(null, activityId, host, jsModulePath, devMode, hmr, jsMinify) as String
    } catch (e: Exception) {
      null
    }
  }

  @DoNotStrip
  @JvmStatic fun handleReactNativeError(
    errorMessage: String,
    stackUnversioned: Any?,
    exceptionId: Int?,
    isFatal: Boolean?
  ) {
    try {
      Class.forName("host.exp.exponent.kernel.Kernel").getMethod(
        "handleReactNativeError",
        String::class.java,
        Any::class.java,
        Int::class.java,
        Boolean::class.java
      ).invoke(null, errorMessage, stackUnversioned, exceptionId, isFatal)
    } catch (e: Exception) {
      throw JavascriptException(errorMessage)
    }
  }

  @DoNotStrip
  @JvmStatic fun handleReactNativeError(
    throwable: Throwable?,
    errorMessage: String,
    stackUnversioned: Any?,
    exceptionId: Int?,
    isFatal: Boolean?
  ) {
    try {
      Class.forName("host.exp.exponent.kernel.Kernel").getMethod(
        "handleReactNativeError",
        Throwable::class.java,
        String::class.java,
        Any::class.java,
        Int::class.java,
        Boolean::class.java
      ).invoke(null, throwable, errorMessage, stackUnversioned, exceptionId, isFatal)
    } catch (e: Exception) {
      throw JavascriptException(errorMessage)
    }
  }

  @DoNotStrip
  @JvmStatic fun getBundleSourceForPath(path: String?): String? {
    return try {
      Exponent.instance.getBundleSource(path!!)
    } catch (e: Exception) {
      null
    }
  }

  private var exponentNetwork: ExponentNetwork? = null
  fun setExponentNetwork(exponentNetwork: ExponentNetwork?) {
    this.exponentNetwork = exponentNetwork
  }

  @DoNotStrip
  @JvmStatic fun getOkHttpClient(callingClass: Class<*>): Any {
    // we build the OkHttp client here so that one cache instance is shared by all concurrent OkHttp instances
    val version = RNObject.versionForClassname(callingClass.name)
    val cookieJar =
      RNObject("com.facebook.react.modules.network.ReactCookieJarContainer").loadVersion(version)
        .construct().get()
    val client = OkHttpClient.Builder()
      .connectTimeout(0, TimeUnit.MILLISECONDS)
      .readTimeout(0, TimeUnit.MILLISECONDS)
      .writeTimeout(0, TimeUnit.MILLISECONDS)
      .cookieJar(cookieJar as CookieJar)
      .cache(exponentNetwork!!.cache)
      .addInterceptor(KernelNetworkInterceptor.okhttpAppInterceptorProxy)
      .addNetworkInterceptor(KernelNetworkInterceptor.okhttpNetworkInterceptorProxy)
    return client.build()
  }
}
